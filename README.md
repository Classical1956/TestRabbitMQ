
## rabbitmq 初步体验

> 本篇是对rabbitmq初步使用的情况记录。


#### 相关环境配置

- [rabbitmq](https://www.rabbitmq.com/)服务环境的配置
- `brew update` 这一步可能需要[替换源](https://lug.ustc.edu.cn/wiki/mirrors/help/brew.git)，同时科学上网
- `brew install rabbitmq`。如果提示 `brew link` 不成功 ，可按照 提示操作。本人遇到的情况是`/usr/local/sbin` 没有*写的权限*!
- 在`.bash_profile` 中添加一下代码，配置环境变量
```
export PATH=${PATH}:/usr/local/sbin
```
- `node`的配置
- `brew install node`
- 使用[amqplib](https://github.com/squaremo/amqp.node)库来实现mq的相关功能
#### 以官网代码为主来尝试各项功能

##### 基本功能
```
graph LR
A(生产者)-->B(queue)
B --> C(消费者)
```

##### 1 生产者 1 queue 多client

```
graph LR
A(生产者)-->B(queue)
B --> C(client1)
B --> ...
B --> D(clientN)
```
product 发出的信息，会均匀的分到多个client。 每次product 发出信息，只会有一个client接收到，从1-N 一个循环。具体按照 client 的绑定 顺序来。

##### 1 生产者 1交换机 多queue 多client
```
graph LR
A(生产者) --> B(exchange)
B --> C(queue1)
B --> D(queue2)
C --> E(client1)
D --> F(client2)
```
product 发出一条消息，经过交换机处理 发送到多个queue,这时多个client会同时收到。


#### [routing 来做到发布到对应的queue](https://www.rabbitmq.com/tutorials/tutorial-four-javascript.html)

```
生产者：
assertExchange(exchange: string, type: string, options?: Options.AssertExchange, callback?: (err: any, ok: Replies.AssertExchange) => void): void;

channel.assertExchange('交换机名称','direct',{durable: false})
direct 是交换机的 匹配规则

publish(exchange: string, routingKey: string, content: Buffer, options?: Options.Publish): boolean;
ch.publish('交换机名称', 'routing关键字', new Buffer('消息'));

消费者端：
ch.assertExchange('交换机名称', 'direct', {durable: false});
声明交换机和生产者一致

bindQueue(queue: string, source: string, pattern: string, args?: any, callback?: (err: any, ok: Replies.Empty) => void): void;

ch.bindQueue(q.queue, '交换机名称', 'routingKey');
```
可以做到一个生产者，发布时 传入不同的`routing` 经过交换机的处理 可以发送到不同的queue中，相应client会得到对应bind的queue中的数据

#### [topic](https://www.rabbitmq.com/tutorials/tutorial-five-javascript.html)多规则匹配

`topic`模式的交换机基本和 `direct`模式交换机一致，不同点在于`routingKey`的规则。
- `direct`中的`routingkey`是单个word，基本遵循严格匹配的模式，完全相同才会发送到对应的queue。
- `topic`的`routingkey`是可以多个单词的组合，以`.`来分割。
- `animal.orange.legs`,可以以 `*`或者`#`的组合来达到模糊匹配。

```

1. node topic_receive.js "#"
这种形式的会接到任何routingkey的消息

2. node topic_receive.js "*.black"
这种形式,只要匹配到black 就会接受到消息

3. node topic_receive.js "animal.*"
这种形式，只要匹配打牌animal就会接受到消息

node topic_product.js animal.sss.qq
这种发布情况，只有1才会接受到消息，单词个数不匹配


node topic_product.js animal.
node topic_product.js animal.xx
这种发布情况，1和3会接受到消息

node topic_product.js axx.black
这种发布情况，2和3会接受到消息
```

#### [RPC](https://www.rabbitmq.com/tutorials/tutorial-six-javascript.html)

测试采用单个queue来作为 service和client通讯
```
service:
ch.consume(q, function reply(msg) {
...

ch.sendToQueue(msg.properties.replyTo,
new Buffer(r.toString()),
{correlationId: msg.properties.correlationId});

ch.ack(msg);
});
service 订阅queue的消息，当派发消息过来后 做相关处理之后， 向 发送queue 发送消息，附带correlationId （Useful to correlate RPC responses with requests. 用来接收方验证是否是它发起的请求）,发送完成 确定此条消息 到达。

client:
ch.consume(q.queue, function(msg) {
if (msg.properties.correlationId == corr) {
console.log(' [.] Got %s', msg.content.toString());
setTimeout(function() { conn.close(); process.exit(0) }, 500);
}
}, {noAck: true});

ch.sendToQueue('rpc_queue',
new Buffer(num.toString()),
{ correlationId: corr, replyTo: q.queue });

client端订阅queue消息,可以接收service端发送的消息。必须要验证msg.properties.correlationId 必须要验证correlationId
向queue发送消息（附带correlationId,以及queue信息），

```
简单来说：
service订阅queue消息等候client的消息命令，处理完成 发送过去。
client订阅queue消息等候service的response。
client 主动发送消息命令，

