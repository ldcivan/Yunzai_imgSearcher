import plugin from '../../lib/plugins/plugin.js'
import { segment } from "oicq";
import { createRequire } from "module";
import fetch from "node-fetch"
import fs from 'fs'
import lodash from 'lodash'
import common from '../../lib/common/common.js'
//const require_ = createRequire(import.meta.url);

//const fetch = require_('node-fetch');

var ApiKey = "5f70aa77c38361f679b06d5499bc7185aba2d9ad" //https://saucenao.com/user.php?page=search-api 处获取
var numres = 3 //返回几个结果（不建议大于5）
var safemode = 0
var imageURL = ""
const _path = `./soufanvideo/`

const _cwdpath = process.cwd();

if (!fs.existsSync(_path)) {
    fs.mkdirSync(_path);
}

let minsim = 0.90; //#匹配度，0.90以下的可能会不太准


export class example extends plugin {
    constructor() {
        super({
            name: 'pic_search',
            event: 'message',
            priority: 1000,
            rule: [
                {
                    reg: '^#?(搜|识)图$',
                    fnc: 'pic_search'
                },
                {
                    reg: '^#?(搜|识)番$',
                    fnc: 'ani_search'
                },
                {
                  reg: "^#?取直链$",
                  fnc: 'pic_link'
                },
                {
                  reg: "^#?(搜|识)图帮助$",
                  fnc: 'pic_search_help'
                }
            ]
        })
    }


    /**关键词搜图 */
    async pic_search(e) {
        await e.reply("别急，在找了……");
        if (e.source) {
          // console.log(e);
          let reply;
          if (e.isGroup) {
            reply = (await e.group.getChatHistory(e.source.seq, 1)).pop()?.message;
          } else {
            reply = (await e.friend.getChatHistory(e.source.time, 1)).pop()?.message;
          }
          if (reply) {
            for (let val of reply) {
              if (val.type == "image") {
                e.img = [val.url];
                break;
              }
            }
          }
        }
        if (!e.img) {
            await this.cancel(e);
            // return true;
            return false;
        }
        imageURL=e.img[0];
        //const response = await axios.get('https://saucenao.com/search.php?db=999&output_type=2&numres='+numres+'&api_key='+ApiKey+'&url='+imageURL,{headers: { "Accept-Encoding": "gzip,deflate,compress" }})
        //var jsonobj = response.data;
        
        var url = 'https://saucenao.com/search.php?db=999&output_type=2&numres='+numres+'&api_key='+ApiKey+'&url='+imageURL
        const response = await fetch(url, { "method": "GET" });
        var jsonobj = await response.json();
        
        //await this.reply(JSON.stringify(jsonobj.results))
        
        let message = []
        let image = []
        for (var i = 0;i < numres;i++){
            message.push(`${i+1}.相似度：${JSON.stringify(jsonobj.results[i].header.similarity)}%\n链接/作品名称：`)
            if(jsonobj.results[i].data.ext_urls){
                for(var j = 0;j < Object.keys(jsonobj.results[i].data.ext_urls).length;j++)
                    message.push(`${JSON.stringify(jsonobj.results[i].data.ext_urls[0])},\n`)
            }
            if(jsonobj.results[i].data.eng_name){
                message.push(`${JSON.stringify(jsonobj.results[i].data.eng_name)},\n`)
            }
            if(jsonobj.results[i].data.jp_name){
                message.push(`${JSON.stringify(jsonobj.results[i].data.jp_name)},\n`)
            }
            if (safemode == 0)
            image.push(`\n${i+1}.\n`)
                image.push(segment.image(jsonobj.results[i].header.thumbnail))
            if (safemode == 1)
                image.push(`搜索结果图样：${jsonobj.results[i].header.thumbnail}`)
        }
        //message.push(`以下是原始数据，可供参考：\n${JSON.stringify(jsonobj.results)}`)
        //this.reply(`以下是原始数据，可供参考：\n${JSON.stringify(jsonobj.results)}`)
        
        let forwardMsg = await this.makeForwardMsg(`以下是使用saucenao引擎的搜图结果：`, message, image)
        await this.reply(forwardMsg)
        //await this.reply(JSON.stringify(jsonobj.results));
        //await this.reply("诶呀，作者还在写，接口还没接上捏");
        //await this.reply(segment.image(e.img[0]));
        await this.reply("以上是所有结果~如果上头没东西，可能是bot被风控了~~");
    }
    
     async ani_search(e) {
        await e.reply("别急，在找了……");
        if (this.e.source) {
            let reply;
            if (this.e.isGroup) {
                reply = (await this.e.group.getChatHistory(this.e.source.seq, 1)).pop()?.message;
            } else {
                reply = (await this.e.friend.getChatHistory(this.e.source.time, 1)).pop()?.message;
            }
            if (reply) {
                for (let val of reply) {
                    if (val.type == "image") {
                        this.e.img = [val.url];
                        break;
                    }
                }
            }
        }

        if (!this.e.img) {

            this.setContext('dealImg');
            await this.reply(" 请发送动漫番剧截图", false, { at: true });
        }else{
            this.dealImg();
        }

    }
    async dealImg() {

        if (!this.e.img) {
            return true;
        }

        let responseImage = await fetch(this.e.img[0]);
        if (!responseImage.ok) {
            await this.reply("获取番剧图片失败", false, { at: true });
        }

        let buffer = await responseImage.arrayBuffer();
        let headers = {
            "Content-Type": "image/jpeg"
        };
        let file = Buffer.from(buffer, 'binary');
        let urlapi = "https://api.trace.moe/search?anilistInfo=&cutBorders=";
        let response = await fetch(urlapi, { method: "POST", body: file, headers });
        let res = await response.json();

        if (res.result.length == 0) {
            await this.reply('未找到相关番剧，此搜索引擎对截图尺寸和质量要求比较高，不支持以下类型截图识别：\n1、有额外添加的黑边\n2、裁切过的不完整截图\n3、左右翻转的\n4、经过滤镜处理的\n5、加了文字的表情包\n6、1990年之前的动画\n7、非正式发行的动画，即同人插图等\n8、非日本动画\n9、画面过暗的\n10、分辨率过低的（须大于 320x180）');
            this.finish('dealImg');
            return true;
        }
        let resultall = res.result[0];
        let fromtime = resultall.from;
        let totime = resultall.to;
        if (resultall.similarity.toFixed(4) < minsim) {
            await this.reply('未找到相关番剧，此搜索引擎对截图尺寸和质量要求比较高，不支持以下类型截图识别：\n1、有额外添加的黑边\n2、裁切过的不完整截图\n3、左右翻转的\n4、经过滤镜处理的\n5、加了文字的表情包\n6、1990年之前的动画\n7、非正式发行的动画，即同人插图等\n8、非日本动画\n9、画面过暗的\n10、分辨率过低的（须大于 320x180）');
            this.finish('dealImg');
            return true;
        }

        let details = await this.getDetails(resultall.anilist.id);
        let synonyms = "";
        for (const key in details.synonyms) {
            synonyms += details.synonyms[key] + "\n";
        }
        let end = "";
        if (details.status != "FINISHED") {
            end = "未完结";
        } else {
            end = details.endDate.year + "年" + details.endDate.month + "月" + details.endDate.day + "日";
        }

        let fengmian;
        if (!resultall.anilist.isAdult) {
            fengmian = details.coverImage.large;
        }

        const message = []
        let msg = [
            fengmian ? segment.image(fengmian) : "",
            "\n" + resultall.anilist.title.native + "\n",
            resultall.anilist.title.romaji + "\n",
            "别名\n" + synonyms + "\n",
            `类型：${details.type} - ${details.format}` + `  共${details.episodes}集\n`,
            "开播时间：" + details.startDate.year + "年" + details.startDate.month + "月" + details.startDate.day + "日 - " + end + "\n",
            "相似度：" + resultall.similarity.toFixed(4) * 100 + "%\n",
            "该截图出自第" + resultall.episode + "集" + Math.floor(fromtime % 3600 / 60) + "分" + Math.floor(fromtime % 60) + "秒至"+ Math.floor(totime % 3600 / 60) + "分" + Math.floor(totime % 60) + "秒\n",
            "以下是该片段截图：",
            segment.image(resultall.image)
        ];

        await this.e.reply(msg);
        await this.e.reply("您也可以在这查看该片段的视讯资料：\n"+resultall.video)

        if (!resultall.video) {
            return true;
        }
        console.log(_cwdpath);
        let url = resultall.video;
        response = await fetch(url);
        let buff = await response.arrayBuffer();
        var me = this;
        //fs.writeFile(`${_path}temp.mp4`, Buffer.from(buff), "binary", async function (err) {
           // console.log(err || "下载视频成功");
            //if (!err) {
                //if (!resultall.anilist.isAdult) {
                    //await me.e.reply(segment.video(`file:///${_cwdpath}/plugins/suiyue/resources/soufanvideo/temp.mp4`));
                //}
            //}
        //});

        this.finish('dealImg');
    }
    async getDetails(id) {

        let query = `{Media (id:${id}) {id coverImage {large}startDate {year,month,day}endDate {year,month,day}season,seasonYear,type,format,status,episodes,synonyms}}`;
        let url = 'https://trace.moe/anilist/';
        let response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query: query }),
        });

        let res = await response.json();
        //await this.reply(JSON.stringify(res))
        return res.data.Media;
    }
    
    async pic_link(e) {
    //await e.reply("正在转直链……");
    if (e.source) {
      // console.log(e);
      let reply;
      if (e.isGroup) {
        reply = (await e.group.getChatHistory(e.source.seq, 1)).pop()?.message;
      } else {
        reply = (await e.friend.getChatHistory(e.source.time, 1)).pop()?.message;
      }
      if (reply) {
        for (let val of reply) {
          if (val.type == "image") {
            e.img = [val.url];
            break;
          }
        }
      }
    }
    if (!e.img) {
        await this.cancel(e);
        // return true;
        return false;
    }
    
    let message = []
    let image = []
    
    for (var i = 0;i < e.img.length;i++){
        message.push(`${i+1}.${e.img[i]}\n`)
    }
    
    image.push(`已获取${i+1}条直链\n`)
    
    let forwardMsg = await this.makeForwardMsg(`以下是您需要的直链：`, message, image)
    await this.reply(forwardMsg)
    await this.reply("以上是所有结果~如果上头没东西，可能是bot被风控了~~");
}
    
    async cancel(e){
        await e.reply("不对啊，这也没图啊，你还是带个图片再说吧！");
    }
    
    async makeForwardMsg (title, msg, img) {
    let nickname = Bot.nickname
    if (this.e.isGroup) {
      let info = await Bot.getGroupMemberInfo(this.e.group_id, Bot.uin)
      nickname = info.card ?? info.nickname
    }
    let userInfo = {
      user_id: Bot.uin,
      nickname
    }

    let forwardMsg = [
      {
        ...userInfo,
        message: title
      },
      {
        ...userInfo,
        message: msg
      },
      {
        ...userInfo,
        message: img
      }
    ]

    /** 制作转发内容 */
    if (this.e.isGroup) {
      forwardMsg = await this.e.group.makeForwardMsg(forwardMsg)
    } else {
      forwardMsg = await this.e.friend.makeForwardMsg(forwardMsg)
    }

    /** 处理描述 */
    forwardMsg.data = forwardMsg.data
      .replace(/\n/g, '')
      .replace(/<title color="#777777" size="26">(.+?)<\/title>/g, '___')
      .replace(/___+/, `<title color="#777777" size="26">${title}</title>`)

    return forwardMsg
  }
  async pic_search_help(e){
      await e.reply("回复图片“#搜图”或带图发送“#搜图”即可查询图片来源\n回复图片“#取直链”或带图发送“#取直链”即可获取图片直链")
  }
}
