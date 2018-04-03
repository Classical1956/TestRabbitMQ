var amqp = require('amqplib/callback_api');

amqp.connect('amqp://localhost', function (error, conn) {
    conn.createChannel(function (err, channel) {
        var q = 'hello';
        channel.assertQueue(q, { durable: false });

        var message = Math.floor(Math.random()*100)+"号消息"

        // Note: on Node 6 Buffer.from(msg) should be used
        channel.sendToQueue(q, new Buffer(message));
        console.log("[x] sent ",message);
    });
    setTimeout(function(){
        conn.close();
        process.exit(0);
    },500);
});