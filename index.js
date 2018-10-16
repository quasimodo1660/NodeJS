//Dependencies
const http = require('http')

const server=http.createServer((req,res)=>{
    res.end('You are SB\n')
})

server.listen(3001,()=>{
    console.log('lestening on port 3001 now')
})