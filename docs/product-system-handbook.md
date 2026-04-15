# 引路人生涯探索系统：产品说明与维护手册

## 1. 这份文档是做什么的

这份文档面向后续继续维护这套系统的人，包括：

- 排查 Bug 的开发者
- 继续补功能的开发者
- 需要快速理解产品全貌的协作者
- 后续要接手系统运营、内容导入、AI 迭代的人

它的目标不是写成技术白皮书，而是回答 4 个最实际的问题：

1. 这个产品现在到底已经能做什么？
2. 数据是怎么组织的？
3. 关键页面、关键接口、关键权限是怎么串起来的？
4. 出问题时应该先看哪里，后续升级应该从哪里下手？

---

## 2. 产品定位

当前产品的用户可见品牌名称是：

- 中文：`引路人生涯探索系统`
- 英文：`Lodestar Career Exploration System`

它不是单纯的“任务管理工具”或“内容库”，而是一套围绕留学/升学长期规划设计的协作系统。核心思路是：

- 学生看到的是自己的长期规划、每周执行、材料档案与 AI 支持
- 家长看到的是进度透明、阶段状态、关键反馈与协作结果
- 顾问看到的是学生工作台、内容库、批量管理与总结工具
- 管理员负责账号、绑定关系、导入导出与后台治理

系统不是围绕“页面”设计的，而是围绕“同一份学生真实进展”设计的。

---

## 3. 当前已经落地的核心能力

### 3.1 营销与访问入口

- 首页：品牌展示、平台预览、角色价值、流程与反馈
- 登录页：示例账号登录、注册/开通方案入口
- 注册/开通方案：面向外部用户展示学生/顾问方案说明
- 隐私与条款页

### 3.2 学生端

- `Dashboard`
  - 实时任务完成率、打卡 streak、掌握度
  - Journey Snapshot 甘特图
  - 本周 AI 建议
  - AI 问答助手
  - 最近完成内容与激励文案
- `Timeline`
  - 年 / 三年 / 月视图
  - 任务新增、编辑、删除
  - Milestone 新增、编辑、删除
  - AI 任务拆解
- `Check-ins`
  - 学习打卡录入、编辑、删除
  - 课程/章节/掌握度记录
- `Explore`
  - 按学生更容易理解的方式看学校、专业、课程、竞赛
  - 有规则推荐 + AI 推荐
- `Settings`
  - 头像、姓名、学校、年级、阶段、目标国家、梦校、专业
- `Documents`
  - 申请档案
  - 竞赛与活动表格
  - Transcript Markdown
  - Planning Book 展示
- `Messages`
  - 学生视角 AI 问答助手

### 3.3 家长端

- `Dashboard`
  - 只读式总览
  - 实时指标
  - Journey Snapshot
  - 家长版 AI 总结
- `Settings`
  - 家长名称与头像维护
- `Messages`
  - 家长视角 AI 问答助手

### 3.4 顾问端

- `Students`
  - 学生列表
  - Student Workspace
  - 按风险、deadline、进度等排序
- Student Workspace
  - 学生资料编辑
  - Timeline 直接维护
  - 申请档案编辑
  - Transcript / Planning Book 录入
  - Notes 管理
  - AI 周报 / AI 会议摘要
- `Content`
  - 内容库维护
  - 按学校 / 专业 / 竞赛 / 课程 / 章节分类型查看
  - 导入、编辑、批量删除
- `Analytics`
  - 顾问视角的实时指标聚合
- `Messages`
  - 顾问视角 AI 问答助手

### 3.5 管理员端

- 独立管理员登录入口
- 成员查看、绑定、导出、删除
- 学生冷启动导入

---

## 4. 角色模型与权限边界

系统当前有 4 个角色，定义在 `src/lib/types.ts`：

- `student`
- `parent`
- `consultant`
- `admin`

### 4.1 学生

学生只能操作自己的数据，包括：

- 自己的资料
- 自己的申请档案
- 自己的 documents 内容
- 自己的 timeline 任务与 milestones
- 自己的 check-ins

### 4.2 家长

家长是只读视角为主，不应拥有学生数据的任意编辑权限。

### 4.3 顾问

顾问只能访问和编辑**自己已绑定的学生**。这一点在关键接口里已经做了关系校验，不能只靠前端页面限制。

### 4.4 管理员

管理员负责：

- 账号创建/导入
- 学生与家长/顾问绑定
- 成员数据导出
- 成员删除

---

## 5. 核心数据对象

系统的关键类型都集中在 `src/lib/types.ts`，后续做功能前建议先看这里。

### 5.1 学生主记录 `StudentRecord`

这是学生最核心的主表对象，保存：

- 姓名
- 年级
- 学校
- 当前阶段
- 目标国家
- 梦校
- 目标专业
- 头像
- 三个概览指标缓存字段

### 5.2 申请档案 `StudentApplicationProfile`

这是学生更详细的申请背景档案，保存：

- 法定姓名 / preferred name
- 出生、国籍、地址、电话
- 高中、课程体系、毕业年份
- GPA / rank / 英语状态
- 竞赛（最多 10 条）
- 活动（最多 20 条）
- Transcript Markdown
- Transcript 结构化 Markdown
- Planning Book Markdown

这个对象是后续 AI 理解学生的重要背景来源。

### 5.3 任务 `Task`

任务有明确的时间线字段：

- `startDate`
- `endDate`
- `timelineLane`
- `dueLabel`
- `dueDate`
- `priority`
- `status`
- `ownerRole`

### 5.4 里程碑 `Milestone`

当前 Milestone 被收窄成 Deadline 语义，核心字段是：

- `title`
- `eventDate`
- `status`

### 5.5 打卡 `CheckInRecord`

记录：

- curriculum
- chapter
- mastery
- date
- notes

### 5.6 内容库 `ContentItem`

内容库采用“公共表 + 分类详情”的结构：

- 公共字段：标题、副标题、国家、标签、难度、来源
- 学校详情：排名、城市、学费、录取率
- 专业详情：学位、STEM、背景、就业路径
- 竞赛详情：主办方、资格、奖项、赛季
- 课程详情：提供方、形式、周数、负荷
- 章节详情：课程体系、顺序、时长、技能

### 5.7 AI 产物与审计日志

系统里所有关键 AI 与写操作，都会留下结构化记录：

- `AiArtifact`
- `AuditLog`

这两类记录是后续排查问题最重要的依据。

---

## 6. 数据访问架构：Supabase 优先，内存兜底

系统现在不是“纯 Supabase”也不是“纯本地假数据”，而是：

- 优先使用 Supabase
- 如果环境没配好或数据库暂时不可用，就回退到内存 store

这套逻辑主要在 `src/lib/data.ts`。

### 6.1 为什么这样设计

这样做的好处是：

- 本地开发和演示可以快速起系统
- 没有环境变量时也不会完全打不开
- 线上环境配置好 Supabase 后，就能走真实持久化

### 6.2 维护时要注意什么

后续改功能时，不能只改 API 层或只改页面层，通常至少要看：

1. `src/lib/types.ts`
2. `src/lib/data.ts`
3. 对应 API route
4. 对应前端页面/组件

如果其中一个没改，最常见的问题就是：

- 页面看着能填，实际落不进库
- Supabase 正常，但 fallback store 没同步
- 本地没报错，换真实环境就出错

---

## 7. 认证、会话与示例账号

### 7.1 会话机制

系统使用 `terra_session` cookie 保存 session payload，逻辑在：

- `src/lib/session.ts`

当前实现是：

- 本地开发允许非 HTTPS
- 生产环境自动启用 `secure`

### 7.2 Auth 模式

通过环境变量切换：

- `demo`
- `supabase`
- `auto`

### 7.3 示例账号

当前 demo store 里存在 4 个基础账号：

- `student@terra.edu`
- `parent@terra.edu`
- `consultant@terra.edu`
- `admin@terra.edu`

默认密码是：

- `terra123`

---

## 8. 页面结构总览

### 8.1 学生端页面

- `/student/dashboard`
- `/student/timeline`
- `/student/checkin`
- `/student/explore`
- `/student/settings`
- `/student/documents`
- `/student/messages`
- `/student/applications`
- `/student/finances`
- `/student/support`

### 8.2 家长端页面

- `/parent/dashboard`
- `/parent/settings`
- `/parent/messages`
- `/parent/applications`
- `/parent/documents`
- `/parent/finances`
- `/parent/support`

### 8.3 顾问端页面

- `/consultant/students`
- `/consultant/students/[studentId]`
- `/consultant/content`
- `/consultant/analytics`
- `/consultant/messages`
- `/consultant/applications`
- `/consultant/documents`
- `/consultant/finances`

### 8.4 管理员页面

- `/admin/login`
- `/admin/dashboard`

---

## 9. AI 现在是怎么工作的

AI 的核心逻辑在：

- `src/lib/ai/provider.ts`

### 9.1 当前 AI 的定位

系统里的 AI 不是直接写数据库的 autonomous agent，而是：

- 给建议
- 给总结
- 做结构化整理
- 为人类提供下一步判断参考

### 9.2 当前已落地的 AI 场景

- 学生端问答助手
- 学生端每周行动建议
- 学生端任务拆解
- 学生端 transcript parse
- 顾问端单个学生周报
- 顾问端会议摘要整理
- 家长端每周总结
- 三端 messages 页面问答

### 9.3 AI 会读哪些信息

当前 AI 上下文会综合这些数据：

- 学生基础资料
- 申请档案
- 任务
- milestones
- check-ins
- 顾问 notes
- transcript / planning book 摘要

### 9.4 AI 的保护原则

当前系统已经明确保持这些原则：

- 所有 AI 输出都带免责说明
- AI 不直接改数据库
- 顾问和家长视角会按角色约束上下文
- 有 trace id / decision id 留痕

---

## 10. 内容库如何理解

顾问端 `Content` 不是学生直接看到的最终形态，而是后台内容治理层。

### 10.1 当前内容库用途

- 给顾问统一维护学校、专业、课程、竞赛、章节内容
- 给学生端 `Explore` 做筛选和推荐来源

### 10.2 当前内容库设计原则

- 后台重“字段完整性”
- 学生端重“易理解的展示”

因此，顾问端是分类型表格，学生端则更像卡片化浏览与推荐视图。

### 10.3 内容导入

系统已经提供：

- 通用内容导入说明
- 学校专用导入模板
- 学生冷启动导入模板

相关文档见：

- `docs/content-import-standard.md`
- `docs/school-import-standard.md`
- `docs/student-import-standard.md`

---

## 11. 管理员、绑定关系与冷启动导入

### 11.1 为什么要有管理员

管理员存在的意义不是日常运营学生，而是：

- 管控账号创建
- 管理家长/顾问与学生绑定
- 做冷启动导入
- 做数据导出与删除

### 11.2 绑定关系

系统中有两种显式绑定：

- `StudentParentLink`
- `StudentConsultantLink`

家长与顾问是否能看到一个学生，最终都应由这里控制。

### 11.3 学生冷启动导入

管理员后台支持 Excel 导入，适合把系统外已经整理好的资料一次性导入。

当前导入可覆盖：

- student_account
- application_profile
- competitions
- activities
- tasks
- milestones
- notes
- bindings

这个功能是后续规模化接入学生的重要入口。

---

## 12. 调试时优先看哪里

后续排查问题时，不建议“全仓乱搜”，建议按类型找入口。

### 12.1 如果是页面显示不对

先看：

1. 对应 page 文件
2. `src/components/client-tools.tsx`
3. `src/components/terra-shell.tsx`

### 12.2 如果是数据保存失败

先看：

1. 对应 API route
2. `src/lib/data.ts`
3. `src/lib/types.ts`
4. Supabase 对应字段是否已经打 patch

### 12.3 如果是权限问题

先看：

1. `src/lib/server/guards.ts`
2. 对应 route 里是否校验了当前用户与 studentId 的关系
3. 管理员/顾问绑定关系是否存在

### 12.4 如果是 AI 输出异常

先看：

1. `src/lib/ai/provider.ts`
2. `/api/ai/chat`
3. `/api/ai/recommendations`
4. `/api/ai/workflows`
5. `AiArtifact` / `AuditLog`
6. `/api/diagnostics`

### 12.5 如果是线上环境问题

先看：

1. 环境变量是否完整
2. `/api/health`
3. `/api/diagnostics`
4. Sentry 是否有报错

---

## 13. `/api/health` 和 `/api/diagnostics` 的价值

这两个接口是后续维护时非常关键的入口。

### 13.1 `/api/health`

主要回答“服务是不是活着”。

### 13.2 `/api/diagnostics`

主要回答：

- 环境变量缺了什么
- 最近有哪些审计日志
- 最近有哪些 AI 产物

如果以后线上有人说“AI 不对”或“保存失败”，先看这个接口，比先猜要高效得多。

---

## 14. 当前数据库 patch 很重要

这个项目已经经历了多轮结构演进，所以 Supabase 不是只跑一次 `schema.sql` 就结束了。

当前维护时必须关注：

- `supabase/patches/001_add_timeline_task_fields.sql`
- `supabase/patches/002_add_milestone_event_date.sql`
- `supabase/patches/003_add_user_avatar.sql`
- `supabase/patches/005_restructure_content_details.sql`
- `supabase/patches/006_school_ranking_text.sql`
- `supabase/patches/007_add_student_application_profiles.sql`
- `supabase/patches/008_add_admin_and_public_registration.sql`
- `supabase/patches/009_add_document_markdown_fields.sql`

如果某个页面“前端已经有字段、保存也发请求了、但数据库没有生效”，最常见原因就是 patch 没执行。

---

## 15. 当前已知的非业务型注意事项

### 15.1 Google Fonts 构建问题

项目在某些网络环境下运行 `npm run build` 时，可能因为 `next/font/google` 拉取字体失败而中断。

这不一定是业务代码错误，而是网络导致的构建问题。后续如果要提升稳定性，可以考虑：

- 本地托管字体
- 或改成不依赖构建时外网下载

### 15.2 Demo store 与真实数据库并存

如果开发时出现“本地能用，线上不对”或“刷新后数据怪异”，要优先判断：

- 现在是在走 demo fallback
- 还是在走 Supabase 真数据

---

## 16. 后续升级建议

如果以后继续升级，我建议优先按下面顺序推进：

### 16.1 第一优先级：稳定性

- 权限校验补齐
- 登录/注册/AI 限流
- 删除与导出审计
- Supabase 降级告警更明显

### 16.2 第二优先级：信息完整性

- Documents 与 AI 的更深整合
- Transcript 结构化展示
- Planning Book 更好的长文阅读与目录
- 导入模板进一步细分

### 16.3 第三优先级：顾问效率

- Student Workspace 更强的批量操作
- 更成熟的家长摘要与周报
- 更完整的风险识别与排序

### 16.4 第四优先级：体验与增长

- 首页与注册转化优化
- 移动端继续精修
- 学生收藏/反馈/推荐闭环

---

## 17. 一句话总览

当前这套系统已经不是一个页面原型，而是一套有：

- 多角色
- 真实数据结构
- AI 场景
- 内容库
- 导入机制
- 审计与诊断入口

的可持续演进产品。

后续维护时，最重要的不是“再加一个页面”，而是继续围绕：

- 同一份学生真实档案
- 同一份长期规划
- 同一份协作上下文

把系统做得更稳、更可解释、更容易扩展。
