import plugin from '../../lib/plugins/plugin.js'
import { segment } from "oicq";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const axios = require('axios');

var ApiKey = "7ce78473c1295ce4c78c741a1fc4e45f4ebdec3c" //https://saucenao.com/user.php?page=search-api 处获取
var numres = 3 //返回几个结果（不建议大于5）
var imageURL = ""


export class example extends plugin {
    constructor() {
        super({
            name: 'pic_search',
            event: 'message',
            priority: 50000,
            rule: [
                {
                    reg: '^#?(搜|识)图$',
                    fnc: 'pic_search'
                },
                {
                  reg: "",
                  fnc: 'searcher_mark'
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
        const response = await axios.get('https://saucenao.com/search.php?db=999&output_type=2&numres='+numres+'&api_key='+ApiKey+'&url='+imageURL,{
            headers: { "Accept-Encoding": "gzip,deflate,compress" }
        })
        
        var jsonobj = response.data;
        let message = []
        for (var i = 0;i < numres;i++){
            message.push(`${i+1}.相似度：${JSON.stringify(jsonobj.results[i].header.similarity)}%\n链接：${JSON.stringify(jsonobj.results[i].data.ext_urls[0])}\n`)
            message.push(segment.image(jsonobj.results[i].header.thumbnail.toString().replaceAll(`\"`, ``).trim()))
        }
        
        let forwardMsg = await this.makeForwardMsg(`以下是使用saucenao引擎的搜图结果：`, message)
        await this.reply(forwardMsg)
        //await this.reply(JSON.stringify(jsonobj.results));
        //await this.reply("诶呀，作者还在写，接口还没接上捏");
        //await this.reply(segment.image(e.img[0]));
        //await this.reply("图图还给你~");
    }
    
    async cancel(e){
        await e.reply("不对啊，这也没图啊，你还是带个图片再说吧！");
    }
    
    async makeForwardMsg (title, msg) {
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
}