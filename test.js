let MongoClient = require("mongodb").MongoClient;
let mongoUrl = "mongodb://wang:112358@localhost:27017";
//let mongoUrl = "mongodb://localhost:27017";

let events=require('events');
let EventEmitter=new events.EventEmitter();


let res = [];
let count = 0;
for(let i=0; i<=150; i++) {
	let obj = {
		num: i/10,
		win_r: [],
		win_w: [],
		equal_r: [],
		equal_w: [],
		lose_r: [],
		lose_w: []
	}
	res.push(obj);
}

let matches = ["EPL","Ered","LFP","SerieA","ligue1"]


MongoClient.connect(mongoUrl, {useNewUrlParser:true}, function(err,client){
    if(err) {
        console.log(err);
        return;
    }
    let db=client.db("football");
    let winPercent = db.collection("percent");
     
    function handleData(name1,name2,sign) {
        let footRel = db.collection(name1).find()
        footRel.each(function(err, doc) {
            if(err) {
                console.log(err);
                return;
            }
            if(doc!=null) {
                let win = parseFloat(doc["win"]),
                    equal = parseFloat(doc["equal"]),
                    lose = parseFloat(doc["lose"]);
                win = win > 15 ? 150 : parseInt(win*10);
                equal = equal > 15 ? 150 : parseInt(equal*10);
                lose = lose > 15 ? 150 : parseInt(lose*10);
                if(doc["result"] === "胜") {
                    res[win].win_r.push(doc);
                    res[equal].equal_w.push(doc);
                    res[lose].lose_w.push(doc);
                }
                if(doc["result"] === "平") {
                    res[win].win_w.push(doc);
                    res[equal].equal_r.push(doc);
                    res[lose].lose_w.push(doc);
                }
                if(doc["result"] === "负") {
                    res[win].win_w.push(doc);
                    res[equal].equal_w.push(doc);
                    res[lose].lose_r.push(doc);
                }
                count++;
                console.log(count);
            } else {
                EventEmitter.emit(sign,name2)
            }

        })
    }
    handleData("EPL","Ered","a");
    EventEmitter.on("a",function(data){
        handleData(data,"LFP","b");
    });
    EventEmitter.on("b",function(data){
        handleData(data,"SerieA","c");
    });
    EventEmitter.on("c",function(data){
        handleData(data,"ligue1","d");
    })
    EventEmitter.on("d",function(data){
        handleData(data,"end","e");
    })
    EventEmitter.on("e",function(data){
        console.log(data);
        for(let i=0; i<res.length; i++) {
            let right = res[i].win_r.length + res[i].equal_r.length + res[i].lose_r.length,
                wrong = res[i].win_w.length + res[i].equal_w.length + res[i].lose_w.length;
            let percent = 0;
            if(wrong + right !== 0) {
                percent = right / wrong + right;
            } else {
                percent = "无记录";
            }
            res[i].percent = percent;
        }
        winPercent.insertMany(res,function(err) {
            if(err) {
                console.log(err);
            } else {
                console.log("添加成功")
            }
        })
    })
    // insertMany(server);
    // find(server);
    // findById(server);
    // update(server);
})
