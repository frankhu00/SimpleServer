import crypto from 'crypto'

let defAlgorithm = 'aes-256-gcm'
let defKey = '2ExCoDy42humpkgQwTKJfsFjUdjmpPpJ'

export function getIV(bytes = 32) {
    return crypto.randomBytes(bytes)
}

export function encrypt(
    text,
    iv,
    { algorithm = defAlgorithm, key = defKey } = {}
) {
    let cipher = crypto.createCipheriv(algorithm, key, iv)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    let tag = cipher.getAuthTag()
    return {
        encrypted,
        tag,
        iv
    }
}

export function decrypt(
    content,
    { algorithm = defAlgorithm, key = defKey } = {}
) {
    //content.tag and content.iv should be instanceof Uint8Array
    //Json.stringify will make these into {type:'Buffer', data: Array(x) }
    if (!(content.iv instanceof Uint8Array)) {
        content.iv = Uint8Array.from(content.iv.data)
        content.tag = Uint8Array.from(content.tag.data)
    }

    let decipher = crypto.createDecipheriv(algorithm, key, content.iv)
    decipher.setAuthTag(content.tag)
    let dec = decipher.update(content.encrypted, 'hex', 'utf8')
    dec += decipher.final('utf8')
    return dec
}
