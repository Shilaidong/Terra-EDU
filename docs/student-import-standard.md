# 学生完整资料与学习中心导入说明

这个模板用于管理员导入一个学生的完整资料包。  
建议一个 Excel 文件只导入一位学生。

导入入口：
- 管理后台 `Student workbook import`
- 只支持 `.xlsx`

导入特点：
- 以“更新 + 补充”为主，不会先把旧数据整批删除
- 学生基础资料和申请档案会更新
- 任务、截止日期、备注会按匹配规则补充或更新
- 绑定关系只会新增，不会自动解绑
- 学习中心会导入成可直接开始练习的内容，而不是旧打卡记录

## Sheet 列表

工作簿请保留以下 sheet 名称，不要改名：

1. `student_account`
2. `application_profile`
3. `competitions`
4. `activities`
5. `tasks`
6. `milestones`
7. `notes`
8. `bindings`
9. `vocabulary_packs`
10. `vocabulary_words`
11. `homework_questions`
12. `reading_passages`

## 1. student_account

用途：
- 学生账号
- 学生基础资料

填写规则：
- 只填一行
- `email` 和 `name` 必填
- 如果这个邮箱已经存在，系统会更新该学生资料，不会新建第二个学生账号
- 如果这个邮箱不存在，系统会创建新学生账号
- 如果新账号没填密码，默认密码会使用 `terra123`

字段：

| 列名 | 是否必填 | 格式/示例 | 说明 |
|---|---|---|---|
| `email` | 是 | `student01@example.com` | 学生登录邮箱 |
| `name` | 是 | `Kira Chen` | 学生姓名 |
| `password` | 否 | `terra123` | 只对新账号生效 |
| `grade` | 否 | `Grade 10` | 年级 |
| `school` | 否 | `Shanghai High School` | 当前学校 |
| `phase` | 否 | `Planning` / `Application` / `Submission` / `Decision` / `Visa` | 当前阶段 |
| `target_countries` | 否 | `United States,United Kingdom` | 用英文逗号分隔 |
| `dream_schools` | 否 | `Princeton University,Stanford University` | 用英文逗号分隔 |
| `intended_major` | 否 | `Economics` | 目标专业 |
| `avatar` | 否 | `/api/assets/avatar/a1.png` | 不填则保留原值或默认头像 |

## 2. application_profile

用途：
- Common App 风格的基础申请档案

填写规则：
- 只填一行
- 都是文本字段
- 日期建议统一写成 `YYYY-MM-DD`

字段：

| 列名 | 是否必填 | 格式/示例 | 说明 |
|---|---|---|---|
| `legal_first_name` | 否 | `Kira` | 法定名字 |
| `legal_last_name` | 否 | `Chen` | 法定姓氏 |
| `preferred_name` | 否 | `Kira` | 常用名 |
| `date_of_birth` | 否 | `2008-04-12` | 出生日期 |
| `citizenship` | 否 | `China` | 国籍 |
| `birth_country` | 否 | `China` | 出生国家 |
| `phone_number` | 否 | `+86 13800000000` | 联系电话 |
| `address_line_1` | 否 | `Lane 88, Pudong` | 地址 |
| `city` | 否 | `Shanghai` | 城市 |
| `state_province` | 否 | `Shanghai` | 省/州 |
| `postal_code` | 否 | `200120` | 邮编 |
| `country_of_residence` | 否 | `China` | 当前居住国家 |
| `high_school_name` | 否 | `Shanghai High School` | 当前高中 |
| `curriculum_system` | 否 | `AP` / `A-Level` / `IBDP` / `US High School` / `Canadian High School` / `Other` | 课程体系 |
| `graduation_year` | 否 | `2027` | 毕业年份 |
| `gpa` | 否 | `3.92/4.0` | GPA |
| `class_rank` | 否 | `Top 5%` | 排名或百分位 |
| `english_proficiency_status` | 否 | `IELTS planned` | 英语考试情况 |
| `intended_start_term` | 否 | `Fall 2027` | 计划入学学期 |
| `passport_country` | 否 | `China` | 护照签发国家 |
| `additional_context` | 否 | `Interested in policy + economics.` | 补充说明 |

## 3. competitions

用途：
- 竞赛 10 格

填写规则：
- 一行一条竞赛
- 最多读取前 10 条非空记录

字段：

| 列名 | 是否必填 | 格式/示例 | 说明 |
|---|---|---|---|
| `name` | 否 | `AMC 12` | 竞赛名称 |
| `field` | 否 | `Mathematics` | 学科方向 |
| `year` | 否 | `2025` | 年份 |
| `level` | 否 | `National` | 级别 |
| `result` | 否 | `Distinction` | 结果/奖项 |

## 4. activities

用途：
- 活动 20 格

填写规则：
- 一行一条活动
- 最多读取前 20 条非空记录

字段：

| 列名 | 是否必填 | 格式/示例 | 说明 |
|---|---|---|---|
| `name` | 否 | `Debate Club` | 活动名称 |
| `role` | 否 | `President` | 角色/职务 |
| `grades` | 否 | `9-11` | 参与年级 |
| `time_commitment` | 否 | `3 hrs/week, 20 weeks/year` | 时间投入 |
| `impact` | 否 | `Led 12 members and organized 3 city scrimmages.` | 影响/简述 |

## 5. tasks

用途：
- 时间线任务

填写规则：
- 一行一条任务
- 匹配逻辑：`title + start_date + end_date`
- 如果导入同一条任务，系统会更新，不会重复新增

字段：

| 列名 | 是否必填 | 格式/示例 | 说明 |
|---|---|---|---|
| `title` | 是 | `Draft personal statement` | 任务标题 |
| `description` | 否 | `Finish first draft and collect comments.` | 任务说明 |
| `start_date` | 否 | `2026-04-01` | 开始日期 |
| `end_date` | 否 | `2026-04-15` | 结束日期 |
| `timeline_lane` | 否 | `standardized_exams` / `application_progress` / `activities` / `competitions` | 甘特图分类 |
| `due_label` | 否 | `PS draft due` | 页面提示文案 |
| `due_date` | 否 | `2026-04-15` | 截止日期 |
| `category` | 否 | `Application` | 不填会自动按 lane 生成 |
| `priority` | 否 | `Low` / `Medium` / `High` | 优先级 |
| `status` | 否 | `pending` / `in_progress` / `done` | 状态 |
| `owner_role` | 否 | `student` / `parent` / `consultant` | 负责人角色 |

## 6. milestones

用途：
- 截止日期 / 关键节点

填写规则：
- 一行一条 milestone
- 匹配逻辑：`title + event_date`

字段：

| 列名 | 是否必填 | 格式/示例 | 说明 |
|---|---|---|---|
| `title` | 是 | `Submit UCAS application` | 标题 |
| `event_date` | 是 | `2026-10-15` | 日期 |
| `status` | 否 | `upcoming` / `done` | 状态 |

## 7. notes

用途：
- 顾问备注

填写规则：
- 一行一条备注
- 要填写 `consultant_email`
- 系统只会绑定到已存在的顾问账号
- 如果顾问邮箱不存在，这条备注会跳过，并在导入结果里提示

字段：

| 列名 | 是否必填 | 格式/示例 | 说明 |
|---|---|---|---|
| `title` | 是 | `March family meeting` | 备注标题 |
| `summary` | 是 | `Parent is concerned about timeline pacing.` | 备注内容 |
| `consultant_email` | 是 | `consultant@terra.edu` | 已存在顾问账号邮箱 |
| `created_at` | 否 | `2026-03-20T10:00:00Z` | 创建时间 |

## 8. bindings

用途：
- 自动绑定家长/顾问到学生

填写规则：
- 只支持绑定“已经注册好的账号”
- 如果邮箱还没注册，这条绑定会跳过，并在导入结果里提示

字段：

| 列名 | 是否必填 | 格式/示例 | 说明 |
|---|---|---|---|
| `kind` | 是 | `parent` / `consultant` | 绑定类型 |
| `email` | 是 | `parent@example.com` | 已存在账号邮箱 |

## 9. vocabulary_packs

用途：
- 学习中心 `单词背诵` 的词包配置

填写规则：
- 一行一个词包
- `pack_name` 必填
- 如果同名词包已经存在，系统会更新该词包配置，不会新建重复词包

字段：

| 列名 | 是否必填 | 格式/示例 | 说明 |
|---|---|---|---|
| `pack_name` | 是 | `托福核心词汇 A1` | 词包名称 |
| `daily_new_count` | 否 | `12` | 每天新背多少个 |
| `daily_review_count` | 否 | `24` | 每天复习多少个 |
| `active` | 否 | `true` / `false` | 是否启用这个词包 |

## 10. vocabulary_words

用途：
- 学习中心 `单词背诵` 的具体单词内容

填写规则：
- 一行一个单词
- 必须带 `pack_name`
- 系统会按 `pack_name + word` 去匹配，不重复新增

字段：

| 列名 | 是否必填 | 格式/示例 | 说明 |
|---|---|---|---|
| `pack_name` | 是 | `托福核心词汇 A1` | 对应词包名称 |
| `word` | 是 | `abandon` | 英文单词 |
| `meaning` | 是 | `放弃；遗弃` | 中文释义 |
| `notes` | 否 | `常见于阅读题` | 备注 |
| `sort_order` | 否 | `1` | 排序号 |
| `completed` | 否 | `false` | 是否已完成 |

## 11. homework_questions

用途：
- 学习中心 `AI 出题批改` 的题库

填写规则：
- 一行一题
- 系统按 `subject + prompt` 匹配，不重复新增
- 每天会从未完成题里随机抽一道

字段：

| 列名 | 是否必填 | 格式/示例 | 说明 |
|---|---|---|---|
| `subject` | 是 | `Biology` | 科目 |
| `prompt` | 是 | `What is the main function of mitochondria?` | 题目内容 |
| `correct_answer` | 是 | `They generate ATP for the cell.` | 正确答案 |
| `explanation` | 否 | `Focus on ATP and energy production.` | 解析 |
| `sort_order` | 否 | `1` | 排序号 |
| `completed` | 否 | `false` | 是否已完成 |

## 12. reading_passages

用途：
- 学习中心 `应试阅读` 的文章库

填写规则：
- 一行一篇文章
- 系统按 `title` 匹配，不重复新增
- 学生导入后可以点击“生成阅读问题”来生成 5 道选择题

字段：

| 列名 | 是否必填 | 格式/示例 | 说明 |
|---|---|---|---|
| `title` | 是 | `Urban Farming and Food Security` | 文章标题 |
| `passage` | 是 | `Long-form reading passage...` | 文章正文 |
| `source` | 否 | `Cambridge reading drill` | 来源 |
| `sort_order` | 否 | `1` | 排序号 |

## 推荐使用顺序

1. 先让学生/家长/顾问账号注册好  
2. 管理员在系统里确认顾问、家长邮箱存在  
3. 下载模板  
4. 填好各个 sheet  
5. 如果要启用学习中心，再补：
   - `vocabulary_packs`
   - `vocabulary_words`
   - `homework_questions`
   - `reading_passages`
6. 回到管理员后台导入  
7. 查看导入结果里的 warning  

## 现在这份模板最适合什么场景？

适合你把系统外已有的学生资料，一次性冷启动导入到平台里，包括：
- 基础学生信息
- 申请档案
- 竞赛和活动
- 时间线任务和截止日期
- 顾问备注
- 学习中心训练内容

这样导入后，学生、家长、顾问三端就都能直接看到比较完整的内容，不需要再从零手工补录。
