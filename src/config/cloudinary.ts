import { v2 as cloudinary } from 'cloudinary';
import { getEnvVariable } from '../utils/getENV';

import dotenv from 'dotenv'

dotenv.config();

(async function() {

    
try {
        cloudinary.config({ 
            cloud_name: getEnvVariable('CLOUD_NAME'), 
            api_key: getEnvVariable('CLOUDINARY_API_KEY'), 
            api_secret: getEnvVariable('CLOUDINARY_API_SECRET'),
            secure: true,
        });

        
} catch (error) {
    console.log('CLOUDINARY CONGIG ERROR ./config/',error);
}

})()

export default cloudinary