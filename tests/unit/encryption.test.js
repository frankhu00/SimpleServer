import 'mocha'
import { expect } from 'chai'

import { encrypt, decrypt, getIV } from '../../src/models/Encryption'

describe('Encryption Tests', () => {
    let secret = 'ThisIsARandomSuperSecret'

    it('can encrypt', () => {
        let encrypted = encrypt(secret, getIV())
        expect(typeof encrypted.encrypted).to.eqls('string')
        expect(encrypted.tag instanceof Buffer).to.eqls(true)
        expect(encrypted.iv instanceof Buffer).to.eqls(true)
    })

    it('can decrypt', () => {
        let encrypted = encrypt(secret, getIV())
        let decrypted = decrypt(encrypted)

        expect(decrypted).to.eqls(secret)
    })

    it('can decrypt using JSON of encrypted object', () => {
        let encryptedAsJsonString = JSON.stringify(encrypt(secret, getIV()))
        // console.log(encryptedAsJsonString)
        let encryptedJSON = JSON.parse(encryptedAsJsonString)

        let decrypted = decrypt(encryptedJSON)
        expect(decrypted).to.eqls(secret)
    })
})
