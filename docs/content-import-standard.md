# Terra Edu 内容导入与展示标准

这份文档把 3 件事说清楚：

1. 公共表有哪些字段
2. 每个类型各自有哪些专属字段
3. 每个类型在表格里应该重点显示什么

## 一、公共表字段

所有内容都共用这些字段：

```text
type,title,subtitle,country,tags,difficulty
```

字段说明：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `type` | 是 | 内容类型 |
| `title` | 是 | 主标题 |
| `subtitle` | 是 | 副标题 / 一句话说明 |
| `country` | 否 | 国家或地区，没有可留空 |
| `tags` | 否 | 多个标签放在一个单元格，用英文逗号分隔 |
| `difficulty` | 是 | `Safety` / `Match` / `Reach` |

固定允许值：

- `type`: `school`, `major`, `competition`, `course`, `chapter`
- `difficulty`: `Safety`, `Match`, `Reach`

说明：

- 手动创建和表格导入都会直接发布
- 不再走 `draft / published` 审核流程

## 二、各类型专属字段

### 1. School

适合学校的字段：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `ranking` | 否 | 推荐写成“数字 + 榜单来源”，例如 `1 UsNews` |
| `city` | 否 | 城市 |
| `tuition_usd` | 否 | 学费，纯数字 |
| `acceptance_rate` | 否 | 录取率，文本，例如 `3.9%` |

推荐表格列：

- Title
- Country
- Ranking
- City
- Tuition
- Acceptance Rate
- Tags
- Difficulty

### 2. Major

适合专业的字段：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `degree` | 否 | 学位，例如 `BS`、`BA` |
| `stem_eligible` | 否 | 是否 STEM，填 `true` 或 `false` |
| `recommended_background` | 否 | 推荐学科背景 |
| `career_paths` | 否 | 就业方向，一个单元格里用英文逗号分隔 |

推荐表格列：

- Title
- Degree
- STEM Eligible
- Recommended Background
- Career Paths
- Tags
- Difficulty

### 3. Competition

适合竞赛的字段：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `organizer` | 否 | 主办方 |
| `eligibility` | 否 | 参赛要求 |
| `award` | 否 | 奖项或结果说明 |
| `season` | 否 | 季度或赛季 |

推荐表格列：

- Title
- Organizer
- Eligibility
- Award
- Season
- Country
- Tags
- Difficulty

### 4. Course

适合课程的字段：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `provider` | 否 | 提供方 / 开课方 |
| `format` | 否 | `Online` / `Offline` / `Hybrid` |
| `duration_weeks` | 否 | 周期，纯数字 |
| `workload` | 否 | 工作量，例如 `5 hours/week` |

推荐表格列：

- Title
- Provider
- Format
- Duration
- Workload
- Tags
- Difficulty

### 5. Chapter

适合章节的字段：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `curriculum` | 否 | 所属课程 |
| `sequence` | 否 | 章节顺序 |
| `estimated_hours` | 否 | 预计时长，纯数字 |
| `key_skill` | 否 | 核心能力 |

推荐表格列：

- Title
- Curriculum
- Sequence
- Estimated Hours
- Key Skill
- Tags
- Difficulty

## 三、完整 CSV 模板表头

```text
type,title,subtitle,country,tags,difficulty,ranking,city,tuition_usd,acceptance_rate,degree,stem_eligible,recommended_background,career_paths,organizer,eligibility,award,season,provider,format,duration_weeks,workload,curriculum,sequence,estimated_hours,key_skill
```

规则：

- 不适用的列直接留空
- 一个文件里可以混合多种 `type`
- 系统会按 `type` 读取对应的专属字段

## 四、字段格式要求

- `tags`: `Engineering,Research,Need-aware`
- `career_paths`: `Consultant,Analyst,Researcher`
- `stem_eligible`: `true` 或 `false`
- `tuition_usd`: `65127`
- `duration_weeks`: `24`
- `estimated_hours`: `12`

不要这样填：

- `Yes / No`
- `6 weeks`
- `$65127`

## 五、CSV 示例

```csv
type,title,subtitle,country,tags,difficulty,ranking,city,tuition_usd,acceptance_rate,degree,stem_eligible,recommended_background,career_paths,organizer,eligibility,award,season,provider,format,duration_weeks,workload,curriculum,sequence,estimated_hours,key_skill
school,Stanford University,Palo Alto California,United States,"Engineering,Research,Need-aware",Reach,6,Palo Alto,65127,3.9%,,,,,,,,,,,,,,
major,Environmental Engineering,Sustainability systems and impact,,"STEM,Climate,Interdisciplinary",Match,,,,BS,true,"Physics,calculus,environmental systems","Sustainability Consultant,Water Systems Engineer",,,,,,,,,,
competition,International Young Eco-Hero Summit,Research and innovation challenge,Global,"Research,Sustainability",Match,,,,,,,Eco Future Alliance,"Grade 9-12 teams",Global finalist recognition,Spring,,,,,,,,
course,AP Physics C,Mechanics and Electricity,,"AP,STEM",Reach,,,,,,,,,,,,Westside Academy,Offline,24,5 hours/week,,,,
chapter,Series and Convergence,Advanced AP Calculus review,,"Math,AP",Match,,,,,,,,,,,,,,,AP Calculus,Unit 7,12,Problem solving
```

## 六、实际使用方式

1. 从模板开始填：
   [`/Users/shi/projects/edu-platform/terra-edu/templates/content-import-template.csv`](/Users/shi/projects/edu-platform/terra-edu/templates/content-import-template.csv)
2. 如果是学校库，优先用学校专用模板：
   [`/Users/shi/projects/edu-platform/terra-edu/templates/school-import-template.csv`](/Users/shi/projects/edu-platform/terra-edu/templates/school-import-template.csv)
3. 每一行先确定 `type`
4. 只填这个类型真正有意义的字段
5. 其余列留空
6. 保存为 `.csv`、`.xlsx` 或 `.xls`
7. 在 `/consultant/content` 导入

## 七、UI 设计原则

是的，**每个类型的表格应该不一样**。

最好的方式不是一张表硬塞所有列，而是：

- 默认总表：显示公共字段 + 一列“详情摘要”
- 当顾问筛选到某一个类型时，切换成该类型专用表头

也就是：

- 筛到 `school`，显示 `Ranking / City / Tuition / Acceptance Rate`
- 筛到 `major`，显示 `Degree / STEM / Career Paths`
- 筛到 `competition`，显示 `Organizer / Eligibility / Award / Season`
- 筛到 `course`，显示 `Provider / Format / Duration / Workload`
- 筛到 `chapter`，显示 `Curriculum / Sequence / Estimated Hours / Key Skill`
