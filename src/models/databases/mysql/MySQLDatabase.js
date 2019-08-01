import mysql from 'mysql2/promise'

import MySQLConfig from './MySQLConfig'
import { decrypt } from '../../Encryption'
import { resolve } from '../../Tools'
import { Notification } from '../../Notification'
import chalk from 'chalk'

class MySQLDatabase {
    /**
     * MySQL wrapper based on mysql2/promise module
     * @param  {object} config
     * @param  {boolean} debug - optional. Default depends on NODE_ENV
     */
    constructor(config, debug) {
        let decryptedConfig = Object.assign({}, config, {
            password: decrypt(JSON.parse(config.password)),
            queryFormat: this.prepareQuery
        })
        this.pool = mysql.createPool(decryptedConfig)
        this.valid = false
        this.logger = new Notification()
        this.inputCache = []

        if (typeof debug == 'boolean') {
            this.setDebug(debug)
        }
    }

    /**
     * For checking if connection is properly established
     * @returns boolean
     */
    async validity() {
        let valid = false
        try {
            let conn = await this.pool.getConnection()
            conn.release()
            valid = true
            this.logger.success('Connection successful')
        } catch (err) {
            valid = false
            this.logger
                .speak()
                .error(`Failed to connect! Error: ${err.message}`)
        }
        return valid
    }

    /**
     * Use for logging only the specified query. Overrides current debug setting for the next log call
     * @returns {Class} MySQLDatabase
     */
    log() {
        this.logger.speak()
        return this
    }

    /**
     * Use to silence the next query. Overrides current debug setting. Opposite to log()
     * @returns {Class} MySQLDatabase
     */
    silence() {
        this.logger.quiet()
        return this
    }

    /**
     * Use to permanently change the logger silence setting
     * @param  {boolean} set
     * @returns {Class} MySQLDatabase
     */
    setDebug(set) {
        this.logger.mute(!set)
        return this
    }

    /**
     * Logs the query statement (raw query, query inputs, and prepared query)
     * @param  {string} sql
     */
    debugStatement(sql) {
        this.logger.with(
            chalk.blueBright,
            `
        ------ MySQL Database Debugger ------

        Using SQL Inputs: ${JSON.stringify(this.getInputs())}

        MySQL Debug - Raw SQL Statement:
        
        ${sql}
        
        MySQL Debug - Prepared SQL Statement:
        
        ${this.prepareQuery(sql, this.getInputs())}
        
        ------ End MySQL Database Debugger ------
        `
        )
    }

    /**
     * Used to specify prepared statement inputs
     *
     * [{name: string, value: any}]
     * @param  {Object[]} inputs=[ ]
     * @returns {Class} MySQLDatabase
     */
    setInputs(inputs = []) {
        this.inputCache = inputs
        return this
    }

    /**
     * Used to get the current prepared statement inputs
     * @returns {any[]} [{name: string, value: any}, ...]
     */
    getInputs() {
        return this.inputCache
    }

    /**
     * To normalize SQL prepare statement format to match MSSQL lib way of useInput
     *
     * This uses @name rather than "?" as defaulted in mysql2 doc
     *
     * inputs is an array of objects with name and value property.
     *
     * [{name: string, value: any}]
     * @param  {string} query
     * @param  {Array<Object>} inputs
     * @returns {string} preparedQuery
     */
    prepareQuery(query, inputs) {
        if (!inputs || !Array.isArray(inputs)) {
            return query
        }

        inputs.forEach(input => {
            const pattern = new RegExp('(@' + input.name + ')\\b', 'g')
            query = query.replace(pattern, mysql.escape(input.value))
        })
        return query
    }

    /**
     * General query method
     * @param  {string} statement
     * @returns [ null | Error, { data: null | [ ], metadata: object | null } ]
     */
    async query(statement) {
        if (this.pool == null) {
            this.logger.speak().error('There is no DB connection!')
            return [new Error('There is no DB connection'), null]
        }

        this.debugStatement(statement)
        let [err, response] = await resolve(
            this.pool.query(statement, this.getInputs())
        )
        let data = response ? response[0] : null
        this.setInputs()
        return [err, this.standardize(data)]
    }

    /**
     * Select query to fetch rows from specified table
     *
     * Use opt param to specify additional conditions
     * @param  {Array | string} select
     * @param  {Array | string} table
     * @param  {string} opt=''
     * @param  {string} limit=''
     * @returns [ null | Error, { data: [ ] | null, metadata: null } ]
     */
    async get(select, table, opt = '', limit = '') {
        const selector = Array.isArray(select) ? select.join(' , ') : select
        const tables = Array.isArray(table) ? table.join(' , ') : table
        const sql = `select ${limit} ${selector} from ${tables} ${opt}`
        return await this.query(sql)
    }

    /**
     * Returns the first result of the select query
     * @param  {Array | string} select
     * @param  {Array | string} table
     * @param  {string} opt=''
     * @param  {string} limit=''
     * @returns [ null | Error, { data: [ ] | null, metadata: null } ]
     */
    async getFirst(select, table, opt = '', limit = '') {
        let [err, resp] = await this.get(select, table, opt, limit)
        resp.data =
            resp.data && resp.data.length > 0 ? [resp.data.shift()] : null
        if (resp.data == null) {
            err = new Error('Record not found')
        }
        return [err, resp]
    }

    /**
     * Update method
     *
     * keyvalue = { column_name: update_to_value, ... }
     *
     * condition = [{param, operator, value}]
     *
     * I.E: [{ param: 'uID', operator: '=', value: '558'}]
     *
     *      operator property is defaulted to '=' if not defined
     *
     *      Please note successful update will return { data: null, metadata: {...}}
     * @param  {Array | string} table
     * @param  {Object<string, any>} keyvalue
     * @param  {Object[]} condition
     * @param  {string} joinKeyword='AND'
     * @returns [ null | Error, { data: null , metadata: object } ]
     */
    async update(table, keyvalue, condition, joinKeyword = 'AND') {
        const tables = Array.isArray(table) ? table.join(' , ') : table

        let {
            column_names,
            value_placeholder_list,
            inputCache
        } = this.processKeyValue(keyvalue)
        let updateList = column_names.map((column, ind) => {
            return `${column} = ${value_placeholder_list[ind]}`
        })
        let { conditionsArray, conditionsInputCache } = this.processCondition(
            condition
        )
        this.setInputs(inputCache.concat(conditionsInputCache))
        const sql = `UPDATE ${tables} SET ${updateList.join(
            ' , '
        )} WHERE ${conditionsArray.join(` ${joinKeyword} `)};`

        //Run the query fn with sql and setInputs(inputCache) done
        return await this.query(sql)
    }

    /**
     * Insert method
     *
     * keyvalue = { column_name: column_value, ... }
     *
     *      Please note successful insert will return { data: null, metadata: {...}}
     * @param  {Array | string} table
     * @param  {Object<string, any>} keyvalue
     * @returns [ null | Error, { data: null, metadata: object } ]
     */
    async insert(table, keyvalue) {
        const tables = Array.isArray(table) ? table.join(' , ') : table
        let {
            column_names,
            value_placeholder_list,
            inputCache
        } = this.processKeyValue(keyvalue)
        let columns = `(${column_names.join(' , ')})`
        this.setInputs(inputCache)
        let values = `(${value_placeholder_list.join(' , ')})`
        const sql = `INSERT INTO ${tables} ${columns} VALUES ${values};`

        //Run the query fn with sql and setInputs(inputCache) done
        return await this.query(sql)
    }

    /**
     * Delete method
     *
     * condition = [{param, operator, value}]
     *
     * I.E: [{ param: 'uID', operator: '=', value: '558'}]
     *
     *      operator property is defaulted to '=' if not defined
     *
     *      Please note successful delete will return { data: null, metadata: {...}}
     * @param  {Array | string} table
     * @param  {Object[]} condition
     * @returns [ null | Error, { data: null , metadata: object } ]
     */
    async delete(table, condition) {
        const tables = Array.isArray(table) ? table.join(' , ') : table
        let { conditionsArray, conditionsInputCache } = this.processCondition(
            condition
        )
        this.setInputs(conditionsInputCache)
        const sql = `DELETE FROM ${tables} WHERE ${conditionsArray.join(
            ' AND '
        )};`

        //Run the query fn with sql and setInputs(inputCache) done
        return await this.query(sql)
    }

    /**
     * Support function used in insert and update method
     *
     * The value subsitution variable is named @DBAddValueX (where X is a number) as default to avoid user naming clash
     *
     * @param  {Array | string} keyvalue
     * @param  {string} valueSubsitutionName='DBAddValue'
     * @returns {Object} { column_names: string[ ], value_placeholder_list: string[ ], inputCache: object[ ] }
     */
    processKeyValue(keyvalue, valueSubsitutionName = 'DBAddValue') {
        const column_names = Object.keys(keyvalue)
        let value_placeholder_list = []
        let inputCache = column_names.map((key, ind) => {
            value_placeholder_list.push(`@${valueSubsitutionName}${ind}`)
            return {
                name: `${valueSubsitutionName}${ind}`,
                value: keyvalue[key]
            }
        })

        return {
            column_names,
            value_placeholder_list,
            inputCache
        }
    }

    /**
     * Support function for update method
     *
     * condition = [{param, operator, value}]
     *
     * I.E: [{ param: 'uID', operator: '=', value: '558'}]
     *
     *      operator property is defaulted to '=' if not defined
     * @param  {Object[]} condition
     * @param  {string} valueSubsitutionName='DBConditionValue'
     * @returns {Object} { conditionsArray: string[ ], conditionsInputCache: object[ ] }
     */
    processCondition(condition, valueSubsitutionName = 'DBConditionValue') {
        let conditionsInputCache = []
        let conditionsArray = condition.map((cond, ind) => {
            let op = cond.operator || '='
            //Populate conditionsInputCache for conditions
            conditionsInputCache.push({
                name: `${valueSubsitutionName}${ind}`,
                value: cond.value
            })

            return `${cond.param} ${op} @${valueSubsitutionName}${ind}`
        })
        return {
            conditionsArray,
            conditionsInputCache
        }
    }

    /**
     * Support function that standardizes query response result.
     *
     * Library currently behaves as follows:
     *
     * Get -> returns list of data
     *
     * Insert, update, delete -> returns {"fieldCount":0,"affectedRows":1,"insertId": 0, ...}
     *
     *      This is now standardized to always return
     *          {data: any[] | null, metadata: object}
     *
     * @param  {any} result
     * @returns {Object} {data: any[] | null, metadata: null | { fieldCount, affectedRows, insertId, info, serverStatus, warningStatus } }
     */
    standardize(result) {
        if (Array.isArray(result)) {
            return {
                data: result.length > 0 ? result : null,
                metadata: null
            }
        } else {
            return {
                data: null,
                metadata: result
            }
        }
    }

    //BELOW IS CONVERSION WIP

    //THIS WILL UPDATE ALL ENTRIES IN SPECIFIED TABLE COLUMNS
    //ONLY USE THIS TO DO MASS UPDATES TO THE ENTIRE TABLE
    // async updateAll(table, keyvalue) {
    //     const tables = Array.isArray(table) ? table.join(' , ') : table
    //     let { column_names, value_placeholder_list, inputCache } = this.processKeyValue(keyvalue)
    //     let updateList = column_names.map( (column, ind) => {
    //         return `${column} = ${value_placeholder_list[ind]}`
    //     })
    //     this.setInputs(inputCache)
    //     const sql = `UPDATE ${tables} SET ${ updateList.join(' , ')};`
    //     //Run the query fn with sql and setInputs(inputCache) done
    //     return await this.query(sql)
    // }
}

export { MySQLDatabase }
export default new MySQLDatabase(MySQLConfig).setDebug(false)
