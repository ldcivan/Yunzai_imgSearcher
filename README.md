# Yunzai_imgSearcher
基于saucenao api的识图插件，为Yunzai-Bot设计

## 使用方法
<del>扔进/plugins/example后，再Yunzai-Bot根目录上运行安装axios（用哪个参照你当时装Yunzai依赖的方法）：</del>

<del><code>cnpm install axios</code>或者<code>npm install axios</code></del>

<del>或者参考这个安装方法>>>https://github.com/ldcivan/Yunzai_imgSearcher/issues/1</del>

不用依赖了，扔进/plugins/example后配置相关参数后重启即可使用

需要在js内配置api密钥，配置方法可参考js内注释；您也可以在js里调整返回结果的数量。

## 注意
api在一定时间内的使用次数有限，请自行通过日志判断是否已经超出用量

另，QQ大概率会ban掉带图的伪造转发内容，所以设立安全模式（js内设定）应付一下，正式方法等我不想摆烂了再说

针对报错fetch is not defined，可以参考这个>>>https://github.com/ldcivan/Yunzai_imgSearcher/issues/3

## 其他
感谢：

* [官方Yunzai-Bot-V3](https://github.com/Le-niao/Yunzai-Bot) : [Gitee](https://gitee.com/Le-niao/Yunzai-Bot)
  / [Github](https://github.com/Le-niao/Yunzai-Bot)
* [椰羊Plugin](https://github.com/yeyang52/yenai-plugin) : [Gitee](https://gitee.com/yeyang52/yenai-plugin)
  / [Github](https://github.com/yeyang52/yenai-plugin)
* [锅巴Plugin](https://github.com/guoba-yunzai/guoba-plugin) : [Gitee](https://gitee.com/guoba-yunzai/guoba-plugin)
  / [Github](https://github.com/guoba-yunzai/guoba-plugin)
