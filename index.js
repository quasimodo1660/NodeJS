//Dependencies
const http = require('http');
const url=require('url');





const server=http.createServer((req,res)=>{
    // console.log(req)
    var parsedUrl=url.parse(req.url,true)
    // console.log(parsedUrl)

    var path=parsedUrl.pathname
    var trimmedPath= path.replace(/^\/+|\/+$/g,'')

    console.log(parsedUrl.query)

    console.log(req.method.toLowerCase())

    console.log(trimmedPath)
    
    res.end('You are SB\n')


})

server.listen(3001,()=>{
    console.log('lestening on port 3001 now')
})