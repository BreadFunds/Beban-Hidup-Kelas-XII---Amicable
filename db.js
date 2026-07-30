import dotenv from 'dotenv'
dotenv.config()
import mongoose from 'mongoose'

mongoose.connect(
    process.env.MONGO_URI
)

const db = mongoose.connection

db.on('connected', ()=>{
    console.log('Database connected')
})

db.on('error', (err)=>{
    console.log(`Database connection error : ${err}`)
})

export default mongoose