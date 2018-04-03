var amqp = require('amqplib/callback_api');

amqp.connect('amqp://localhost', function (err, conn) {
    conn.createChannel(function (err, ch) {
        var q = 'hello';
        ch.assertQueue(q, { durable: false });
        console.log("[*] waiting for message in %s,To exit press CTRL+C", q);
        // ch.consume(q, function (msg) {
        //     console.log("[x] Received => %s", msg.content.toString());
        // }, { noAck: true });

        ch.get(q,{noAck:true},function(err,message){
            if (!err && message){
                console.log("[x] get => %s",message.content.toString());
            }else{
                console.log("[x] error get =>",err);
            }
            
            conn.close();
            process.exit(0);
        })

    });
});