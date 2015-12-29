/* global Buffer */
var plugins = [
    new (require('./plugins/nec.js'))(),
    new (require('./plugins/samsung.js'))()
];

module.exports = function (RED) {
    function IrNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        
        node.on('input', function(msg) {
            var input = msg.payload;
            if (Buffer.isBuffer(input)) {
                if (input.length % 2 != 0)
                    return;

                var pulses = [], i;
                for (i=0; i<input.length; i+=2) {
                    var pulse = (input[i] << 8) | input[i+1];
                    pulses.push(pulse);
                }

                for (i=0; i<plugins.length; i++) {
                    var decoded = plugins[i].decode(pulses);
                    if (decoded) {
                        msg.payload = decoded;
                        node.send(msg);
                        return;
                    }
                }
            } else if (typeof input === 'string') {
                for (var i=0; i<plugins.length; i++) {
                    var pulses = plugins[i].encode(input);
                    if (pulses) {
                        var data = [];
                        for (i=0; i<pulses.length; i++) {
                            var pulse = pulses[i];
                            data.push(pulse >> 8);
                            data.push(pulse & 0xFF);
                        }

                        msg.payload = new Buffer(data);
                        node.send(msg);
                        return;
                    }
                }
            }
        });
    }
    
    RED.nodes.registerType("ir_decenc", IrNode);
}
