const mongoose = require('mongoose')
const {exec} = require('child_process')
const { DefaultDeserializer } = require('v8')
const os = require('os')
const dbname = "rpi_ip"
const dburl = "mongodb+srv://Avin:avin@cluster0.ayk9r.mongodb.net/"



const IpSchema = new mongoose.Schema({
    interface : String,
    ip : String ,
    updateAt : {type:Date , default: Date.now ,
    },
}) 
const IP = mongoose.model("IP" , IpSchema)

const getIPAddress = (a) => {
    return new Promise((resolve, reject) => {
        exec(`ifconfig ${a} | grep "inet " | awk \'{ print $2 }\'`, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else if (stderr) {
                reject(new Error(stderr));
            } else {
                const ip = stdout.trim();
                resolve(ip);
            }
        });
    });
};


async function updateIPAddress(a) {
    try {
        const ip = await getIPAddress(a);
        const result = await IP.findOneAndUpdate({ interface: a }, { ip, updateAt: new Date() }, { upsert: true, new: true });
        console.log(result.ip);
        mongoose.connection.close()
        process.exit(0)
    } catch (error) {
        console.error("Error updating ip address", error);
    }
}

function checkConnection(){
    const networkInterfaces = os.networkInterfaces();
    const wlanisConnected = networkInterfaces['wlan0'] && networkInterfaces['wlan0'].some(iface => iface.family === 'IPv4')
    const ethisConnected = networkInterfaces['eth0'] && networkInterfaces['eth0'].some(iface => iface.family === 'IPv4')
    if(wlanisConnected || ethisConnected){
        setTimeout(()=>{
            mongoose.connect(dburl+dbname,
                {useNewUrlParser: true},
                {useCreateIndex :true}).then(()=>{
                    console.log("connected to database")
            })
        },6000)


        if(ethisConnected == true){
            updateIPAddress("eth0")
        }else{
            updateIPAddress("wlan0")
        }

    }
    
}
setInterval(checkConnection,6000)

