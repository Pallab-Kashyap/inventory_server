export const getEnvVariable = (key: string) => {
    const value = process.env[key]

    if(!value){
        throw new Error(`ENV value is missing for the key: ${key}`)
    }

    return value
}