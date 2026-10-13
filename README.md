# 机械臂研究图谱

交互式浏览大模型控制机械臂的研究脉络，查看关联论文、作者报告的局限及共同问题。

网站：<https://xwangrs.github.io/robot-arm-research-atlas/>

## 使用

拖动节点调整位置，拖动画布或滚轮缩放。点击节点查看研究关系和论文，点击论文链接跳转原文。侧栏支持搜索和路线筛选。

节点位置保存在当前浏览器的本地存储中，不会自动同步到其他设备，也不会改变其他访问者看到的默认布局。“重置布局”可以恢复默认位置。原网站与 GitHub Pages 的网址不同，浏览器保存的旧布局不会自动迁移。

## 更新内容

- `data.json`：已有研究节点、关系、论文及作者证据。
- `questions.json`：虚拟节点、共同不足及其来源关系。
- `evidence.csv`：供访问者下载的作者证据表；更新证据时请同步维护。
- `index.html`：页面结构；文献数量等说明文字如有变化，请一并更新。
- `app.js`、`geometry.js`、`styles.css`：交互、图形布局和样式。

修改 JSON 时应保留合法格式及节点、论文和证据之间的有效引用。提交更新后，GitHub Pages 会重新发布。

## GitHub Pages

本项目是静态网站，无需后端或构建步骤。在仓库的 **Settings → Pages** 中选择 **Deploy from a branch**，发布分支选择 `main`，目录选择 `/ (root)`。`.nojekyll` 用于直接发布静态文件。

本地预览可在此目录执行 `python3 -m http.server 8000`，然后打开 <http://localhost:8000/>。网页通过 HTTP 读取 JSON，不建议直接双击 `index.html`。

图谱中较早论文的局限不自动等于今天仍未解决；请结合所列论文版本与原文核对。
