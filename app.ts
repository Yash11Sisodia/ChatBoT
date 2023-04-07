import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios'
import express,{NextFunction, Request,Response} from 'express';
import bodyParser from "body-parser"; 
const app=express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


import { createClient } from 'redis';
const client = createClient(
    //{url  : }
);

import twilio from 'twilio';
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
twilio(accountSid, authToken);




app.use('/msg',async (req:Request,res:Response,next:NextFunction)=>{

const {Latitude,Longitude} =req.body;
const { MessagingResponse } = twilio.twiml;
const twiml = new MessagingResponse();

if(Latitude && Longitude){
    if(await client.EXISTS('LatitudeC') &&  await client.EXISTS('LongitudeC') ) {
          twiml.message(`Your Current Latitude : ${ await client.get('LatitudeC')}  Longitude :${ await client.get('LongitudeC')} , and destined location is Latitude : ${Latitude}  Longitude : ${Longitude}`);
    }else {
        await client.set('LatitudeC', `${Latitude}`);
        await client.set('LongitudeC', `${Longitude}`);
        twiml.message(`Your Current Latitude : ${Latitude}  Longitude : ${Longitude}, Where Would You Like To Go`);
    }

return res.status(200).send(twiml.toString());
}
//handle or ignore useless data
next();
})
const sendDirection= async (LatitudeC:any,LongitudeC:any,Latitude:any,Longitude:any) => {
 let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${LatitudeC},${LongitudeC}&destination=${Latitude},${Longitude}&key=${process.env.API_KEY}`;
 const result = await axios.get(url);
 return result.data;
}

app.use('/getdirec',async (req:Request,res:Response,next:NextFunction)=>{

    const {Latitude,Longitude} =req.body;
    const { MessagingResponse } = twilio.twiml;
    const twiml = new MessagingResponse();
    
    if(Latitude && Longitude){
        if(await client.EXISTS('LatitudeC') &&  await client.EXISTS('LongitudeC') ) {
            await client.set('LatitudeD', `${Latitude}`);
            await client.set('LongitudeD', `${Longitude}`);
            let LatitudeC=await client.get('LatitudeC');
             let LongitudeC= await client.get('LongitudeC');
         
            twiml.message(`Your Current Latitude : ${ LatitudeC}  Longitude :${ LongitudeC} , and destined location is Latitude : ${Latitude}  Longitude : ${Longitude}`);
           
            twiml.message(JSON.stringify(sendDirection(LatitudeC,LongitudeC,Latitude,Longitude)));

       
        }else {
            await client.set('LatitudeC', `${Latitude}`);
            await client.set('LongitudeC', `${Longitude}`);
            twiml.message(`Your Current Latitude : ${Latitude}  Longitude : ${Longitude}, Where Would You Like To Go`);
        }
    
    return res.status(200).send(twiml.toString());
    }
   // handle or ignore useless data
    
    next();
    })



app.listen(3002,async ()=>{
console.log('server running');
client.on('error', err => console.log('Redis Client Error', err));
await client.connect();
console.log('redis connected'); 
});