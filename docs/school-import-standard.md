# Terra Edu 学校导入模板说明

这份说明只针对 `school` 类型，适合你后面单独整理学校库时直接照着填。

模板文件：

[`/Users/shi/projects/edu-platform/terra-edu/templates/school-import-template.csv`](/Users/shi/projects/edu-platform/terra-edu/templates/school-import-template.csv)

## 一、学校专用表头

```text
type,title,subtitle,country,tags,difficulty,ranking,city,tuition_usd,acceptance_rate
```

## 二、每一列怎么填

| 字段 | 必填 | 说明 | 示例 |
| --- | --- | --- | --- |
| `type` | 是 | 固定填 `school` | `school` |
| `title` | 是 | 学校英文主名称，建议和官方名一致 | `Princeton University` |
| `subtitle` | 是 | 中文名或一句识别说明 | `普林斯顿大学` |
| `country` | 否 | 国家或地区 | `United States` |
| `tags` | 否 | 多个标签放一格，用英文逗号分隔 | `Ivy League,Research` |
| `difficulty` | 是 | `Safety` / `Match` / `Reach` | `Reach` |
| `ranking` | 否 | 推荐写成“数字 + 榜单来源” | `1 UsNews`、`2 QS` |
| `city` | 否 | 城市 | `Princeton NJ` |
| `tuition_usd` | 否 | 学费，纯数字，不要带 `$` | `62688` |
| `acceptance_rate` | 否 | 录取率，推荐直接写百分比 | `4.0%` |

## 三、最推荐的填写方式

### 1. 排名

推荐这样写：

- `1 UsNews`
- `2 QS`
- `12 THE`

这样系统会：

- 存储原始文本
- 页面里自动显示成更清楚的 `#1 + UsNews` 形式
- 排序时会自动识别前面的数字

### 2. 学费

只填数字：

- 对：`62688`
- 不对：`$62,688`

### 3. 录取率

推荐直接写百分比：

- `4.0%`
- `17.5%`

如果你写小数：

- `0.04`
- `0.175`

系统也会尽量自动转成百分比显示。

## 四、示例

```csv
type,title,subtitle,country,tags,difficulty,ranking,city,tuition_usd,acceptance_rate
school,Princeton University,普林斯顿大学,United States,"Ivy League,Research",Reach,1 UsNews,Princeton NJ,62688,4.0%
school,Massachusetts Institute of Technology,麻省理工学院,United States,"STEM,Research",Reach,2 UsNews,Cambridge MA,59476,4.0%
school,University of Oxford,牛津大学,United Kingdom,"Humanities,Research",Reach,1 QS,Oxford,51500,17.5%
```

## 五、导入建议

- 学校内容优先用这份专用模板，不要混在总模板里一起填
- 中文多的时候优先用 `.xlsx`
- 如果用 `.csv`，建议直接用项目里的模板另存，不要新建空白 CSV

## 六、页面显示效果

导入后，学校表会更清楚地显示：

- 排名：`#1` + `UsNews`
- 城市：城市标签
- 学费：`$62,688/yr`
- 录取率：`4.0%`
