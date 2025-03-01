import express from 'express'
import errorHandler from './middlewares/errorHandler'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'

import imageRouter from './routes/imageRoute'
import authRotue from './routes/authRoute'
import productRoute from './routes/productRoutes'
import categoryRoute from './routes/categoryRotue'
import optionRoute from './routes/optionRotue'

dotenv.config()

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.use('/api/v1/auth', authRotue)
app.use('/api/v1/image', imageRouter)
app.use('/api/v1/category', categoryRoute)
app.use('/api/v1/option', optionRoute)
app.use('/api/v1/product', productRoute)


app.use(errorHandler)

app.listen(3001, () => console.log('app listning'));
