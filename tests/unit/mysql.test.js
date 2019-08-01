import 'mocha'
import { expect, assert } from 'chai'

import db from '../../src/models/databases/index'

describe('Simple MySQL DB Tests', function() {
    this.bail(true)

    before(() => {
        db.setDebug(false)
    })

    describe('Validate MySQL Connection', () => {
        it('Can connect to MySQL', async () => {
            let validity = await db.validity()
            expect(validity).to.equals(true)
        })
    })

    describe('MySQL DB Query Tests', () => {
        it('Can use query fn to select test table', async () => {
            let [err, resp] = await db.query('select * from test')
            // console.log(resp.data)
            expect(err).to.eqls(null)
            expect(resp.data).to.not.eqls(null)
            expect(resp.data.length).to.greaterThan(0)
        })

        it('Can use get fn to get test table', async () => {
            let [err, resp] = await db.get('*', 'test')
            // console.log(resp.data)
            expect(err).to.eqls(null)
            expect(resp.data).to.not.eqls(null)
            expect(resp.data.length).to.greaterThan(0)
        })

        it('Can use getFirst fn to get first test record', async () => {
            let [err, resp] = await db.getFirst('*', 'test', 'order by id asc')
            // console.log(resp.data)
            expect(err).to.eqls(null)
            expect(resp.data).to.not.eqls(null)
            expect(resp.data.length).to.eqls(1)
        })

        it('Returns empty null when get query has no results', async () => {
            let [err, resp] = await db
                .setInputs([
                    { name: 'username', value: 'thisisafakeusernamefortesting' }
                ])
                .get('*', 'test', 'where name = @username order by id asc')
            // console.log(err, resp)
            expect(err).to.eqls(null)
            expect(resp.data).to.eqls(null)
        })

        it('Errors when getFirst fn returns empty result', async () => {
            let [err, resp] = await db
                .setInputs([
                    { name: 'username', value: 'thisisafakeusernamefortesting' }
                ])
                .getFirst('*', 'test', 'where name = @username order by id asc')
            // console.log(err, resp)
            expect(err).to.not.eqls(null)
            expect(err.message).to.eqls('Record not found')
            expect(resp.data).to.eqls(null)
        })

        describe('MySQL Insert, Update, Delete Flow (affects DB test table)', () => {
            this.bail(true)
            let testName = 'MySQL Automated Insert Test'
            let insertedId = null //should be defined once inser test passes
            let testUpdatedName = 'MySQL Automated Update Test'

            it('Can insert dummy test row into test table', async () => {
                let [err, resp] = await db.insert('test', {
                    name: testName
                })

                // console.log(resp.metadata)
                expect(err).to.eqls(null)
                expect(resp.data).to.eqls(null)
                expect(typeof resp.metadata).to.eqls('object')
                expect(typeof resp.metadata.insertId).to.not.eqls('undefined')
                expect(resp.metadata.affectedRows).to.eqls(1)
                insertedId = resp.metadata.insertId
            })

            it('Can use dummy insert test ID to update test table', async () => {
                if (insertedId == null) {
                    assert.fail('InsertedId from insert test not found')
                } else {
                    let [err, resp] = await db.update(
                        'test',
                        {
                            name: testUpdatedName
                        },
                        [{ param: 'id', value: insertedId }]
                    )

                    // console.log(resp.metadata)
                    expect(err).to.eqls(null)
                    expect(resp.data).to.eqls(null)
                    expect(typeof resp.metadata).to.eqls('object')
                    expect(resp.metadata.affectedRows).to.eqls(1)
                }
            })

            it('Can use dummy insert test ID to delete inserted dummy row', async () => {
                if (insertedId == null) {
                    assert.fail('InsertedId from insert test not found')
                } else {
                    let [err, resp] = await db.delete('test', [
                        { param: 'id', value: insertedId }
                    ])

                    // console.log(resp.metadata)
                    expect(err).to.eqls(null)
                    expect(resp.data).to.eqls(null)
                    expect(typeof resp.metadata).to.eqls('object')
                    expect(resp.metadata.affectedRows).to.eqls(1)
                }
            })
        })

        describe('MySQL Injection Tests', () => {
            let randomName = ':LKweE!wa325OKcsK459EC56dcs&LTK'
            let injectionString = `${randomName}' OR 1=1 -- `
            let totalTestTableRecords = 0

            before(async () => {
                let [_, resp] = await db.get('*', 'test')
                if (!resp || !resp.data) {
                    throw new Error('Get query failed')
                }

                totalTestTableRecords = resp.data.length
            })

            beforeEach(() => {
                if (totalTestTableRecords == 0) {
                    throw new Error(
                        'There are no records in test table to compare with'
                    )
                }
            })

            it('Will run injection when using raw query', async () => {
                //should execute injection and returns all records on test table as a result (which matches totalTestTableRecords)
                let [err, injection] = await db.get(
                    '*',
                    'test',
                    `where name = '${injectionString}' order by name asc`
                )

                //Checking SQL injection IS executed
                // console.log(err, injection)
                expect(err).to.eqls(null)
                expect(Array.isArray(injection.data)).to.eqls(true)
                expect(injection.data.length).to.eqls(totalTestTableRecords)
            })

            it('Can prevent SQL injection with setInput', async () => {
                let [err, resp] = await db
                    .setInputs([
                        {
                            name: 'name',
                            value: injectionString
                        }
                    ])
                    .get('*', 'test', `where name = @name order by name asc`)

                //Checking SQL injection is NOT executed
                expect(err).to.eqls(null)
                expect(resp.data).to.eqls(null) //since there shouldn't be any matches on select statement
                expect(resp.metadata).to.eqls(null)
            })
        })
    })
})
