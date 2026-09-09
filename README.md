# Logseq 知识库

这是一个 Logseq 数据库图谱的私有备份仓库。

## 使用方式

1. 安装 Logseq。
2. 将本仓库克隆到本地。
3. 在 Logseq 中选择「打开本地目录」，打开仓库目录。

仓库保留了图谱数据库和附件；本机登录凭据、运行日志、锁文件以及历史备份不会提交到 GitHub。

## 协作

仓库当前为公开仓库。需要他人共同维护时，在 GitHub 仓库的 Settings -> Collaborators 中邀请对方。

## 在线浏览

`docs/` 是从数据库图谱生成的只读网页快照，GitHub Pages 发布后可以直接在浏览器中阅读。更新本地 Logseq 内容后，运行：

```bash
node scripts/build-static-site.js
git add docs graphs
git commit -m "Update published snapshot"
git push
```

网页不会发布用户资料字段；原始数据库仍保存在仓库中，用于 Logseq 恢复和备份。
