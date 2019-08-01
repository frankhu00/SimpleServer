export function atob(base64Encode) {
    return Buffer.from(base64Encode, 'base64').toString()
}

export function btoa(text) {
    return Buffer.from(text).toString('base64')
}

export function resolve(promise) {
    return promise.then(data => [null, data]).catch(err => [err, null])
}
