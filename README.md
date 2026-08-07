# hbg-hanzi-chaizi-video

一个使用 Remotion 制作的 9:16 汉字趣味拆字短视频示例：上方逐笔写出“懒”，下方将字形拆分并演变为“心”和“赖”，配合 Edge TTS 中文旁白、逐行字幕和背景音乐。

## 视频设定

- 画幅：1080 × 1920，30 fps
- 配音：Edge TTS `zh-CN-YunjianNeural`
- 语速：`rate=-20%`，不改变音调
- 字幕：随旁白逐行显示，去掉每行末尾标点
- 笔画数据：[`hanzi-writer-data`](https://github.com/chanind/hanzi-writer-data)，其数据源自 [Make Me a Hanzi](https://github.com/skishore/makemeahanzi)

这里的“心 + 赖”用于视觉拆字和文案联想，不应当作《说文解字》或严格的历史字源结论。

## 运行

需要 Node.js、Python 3 和 FFmpeg。

```bash
npm install
python3 -m pip install -r requirements.txt
npm run tts
```

请将一首你拥有使用及分发权的音乐放到：

```text
public/audio-lan-yunjian/background.mp3
```

然后预览或渲染：

```bash
npm run dev
npm run render
```

成片默认输出到 `renders/lan-chaizi.mp4`。

## 自定义

- 修改 `scripts/generate_lan_yunjian_edge_tts.py` 中的 `TEXT` 和 `CAPTION_LINES` 可更换旁白与字幕。
- 修改 `src/LanYunjianTransformComposition.tsx` 可调整字形、配色、拆分动画和音乐音量。
- 更换汉字时，需要同时更换 `hanzi-writer-data` 的 JSON 导入，并重新判断各笔画所属部件。

## 音乐说明

本仓库不包含示例成片所使用的背景音乐原文件，因为其再次分发授权未在本项目中确认。请自行提供合法授权的 `background.mp3`。

## License

项目代码采用 [MIT License](LICENSE)。第三方依赖及汉字数据遵循各自许可证。
