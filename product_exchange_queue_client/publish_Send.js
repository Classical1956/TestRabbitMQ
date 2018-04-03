var amqp = require('amqplib/callback_api')

amqp.connect('amqp://localhost',function(err,conn){
    conn.createChannel(function(cerr,ch){
        var ex = 'logs';
        var msg = process.argv.slice(2).join(' ') || 'Hello world!';
        
        ch.assertExchange(ex,'fanout',{durable:false});

        ch.publish(ex,'',new Buffer(msg));
        
        console.log(" [x] send %s",msg);
        setTimeout(function(){
            conn.close();
            process.exit(0);
        },500);
    })

    
})