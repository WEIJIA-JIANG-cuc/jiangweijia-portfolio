// Source-backed copy. zh preserves original work names; en is an editorial translation.
const pair = (zh, en) => ({ zh, en });
const resource = (href, zh, en, type = 'pdf') => ({ href, label: pair(zh, en), type });
const portfolio = resource('./content/files/portfolio.pdf', '查看原始作品集', 'Original portfolio');
const games = resource('./content/files/games.pdf', '查看游戏经历作品集', 'Game portfolio');
const writing = resource('./content/files/writing.pdf', '阅读文字作品集节选', 'Writing excerpts');
const resume = resource('./content/files/resume.pdf', '查看简历', 'Resume');
const email = resource('mailto:jiangweijia_cuc@163.com', '发送邮件', 'Send an email', 'mail');

export const catalog = {
  GameProduct: {
    label: 'GAMES & PRODUCT', title: 'Games & Product',
    subtitle: pair('从玩家体验到设计判断', 'From player experience to design decisions'),
    intro: pair('用关卡分析、竞品观察和课程实践，探索规则、反馈与内容如何影响用户体验。', 'Level analysis, competitor research and coursework exploring how rules, feedback and content shape user experience.'),
    entries: [
      {
        id: 'water-sort', title: pair('《水排序》关卡诊断与体验优化研究', 'Water Sort: Level Diagnosis & Experience Design'),
        kind: pair('个人分析练习 · 2026.06-07', 'Personal analysis exercise · Jun-Jul 2026'),
        summary: pair('围绕前100关的分析材料，建立分阶段评估标准，并把体验问题转化为改关建议和A/B测试方案。实验分组与上线策略均为提案。', 'Built a staged assessment framework around analysis material for the first 100 levels, then translated experience problems into redesign recommendations and an A/B test proposal. Experiment groups and rollout plans are proposals.'),
        bullets: [
          pair('交叉观察关流失、耗时、重试与退出归因；提出“分钟流失低不等于好关卡”的判断。', 'Compared level churn, time spent, retries and exit attribution; questioned whether low per-minute churn really indicates a good level.'),
          pair('以“内容厚度、难度适配、心流体验”拆解参与感，比较第33关与第34关的解题空间和反馈。', 'Used content depth, difficulty fit and flow to compare the problem-solving space and feedback in levels 33 and 34.'),
          pair('提出关卡、交互提示、激励与视觉四类优化，并设计分组实验、观测指标及广告收入护栏。', 'Proposed level, interaction, reward and visual changes, with test groups, evaluation metrics and an ad-revenue guardrail.')
        ], links: [games]
      },
      {
        id: 'xiaotianqi', title: pair('“小天气”AI穿搭与出行助手', 'XiaoTianqi: AI Outfit & Travel Assistant'),
        kind: pair('课程项目 · 组长 · 2025.03-05', 'Course project · Team lead · Mar-May 2025'),
        summary: pair('负责天气类APP的AI内容模块，把穿搭、出行和运动需求转化为功能设计、系统Prompt与结构化知识库。', 'Led the AI content module of a weather app, translating outfit, travel and exercise needs into feature design, system prompts and a structured knowledge base.'),
        bullets: [
          pair('通过问卷和访谈梳理天气建议的使用场景与需求。', 'Used questionnaires and interviews to identify contexts and needs for weather advice.'),
          pair('设计AI穿搭助手及出行运动建议，定义智能体的回答逻辑。', 'Designed outfit and travel/exercise advice features and defined the agent’s response logic.'),
          pair('按温度、天气和风力组织知识库，为建议提供场景依据。', 'Organized the knowledge base by temperature, weather and wind to ground contextual advice.')
        ], links: [resume]
      },
      {
        id: 'ai-companion', title: pair('AI对话陪伴类产品调研', 'AI Conversation Companion Research'),
        kind: pair('竞品调研', 'Competitor research'),
        summary: pair('整理陪伴类产品的定位、对话体验与付费方式，观察不同产品如何回应用户的情感交流需求。', 'Compared positioning, conversation experiences and payment models in companion products, examining how they address emotional communication needs.'),
        bullets: [pair('以竞品调研表记录产品差异，作为后续产品机会判断的材料。', 'Recorded product differences in a research table as input for future opportunity assessment.')],
        links: []
      },
      {
        id: 'otome-cards', title: pair('乙游卡牌内容体系调研', 'Otome Game Card Content Research'),
        kind: pair('内容与竞品研究', 'Content and competitor research'),
        summary: pair('观察乙女游戏的卡牌叙事与内容结构，梳理角色情感投入、用户期待和收集动机之间的联系。', 'Examined card storytelling and content structure in otome games, considering relationships between character attachment, player expectations and collection motivation.'),
        bullets: [pair('通过竞品表整理内容差异；材料呈现研究观察，不代表已上线的卡牌设计。', 'Organized content differences in a comparison table; these are research observations rather than shipped card designs.')],
        links: []
      }
    ], resources: [games, resume]
  },
  Photography: {
    label: 'PHOTOGRAPHY', title: 'Photography',
    subtitle: pair('观察自然，也记录现场', 'Observing nature, documenting moments'),
    intro: pair('鸟类、风景与活动现场，是原始作品集中的摄影主题。用画面记录细节，让观察成为表达的一部分。', 'Birds, landscapes and events are the photography subjects in the original portfolio. Images turn close observation into a form of expression.'),
    entries: [
      {
        id: 'nature-photography', title: pair('自然与鸟类摄影', 'Nature & Bird Photography'),
        kind: pair('个人摄影选作', 'Selected personal photography'),
        summary: pair('从自然观察出发，记录鸟类与环境中的细微瞬间。更多选作见原始作品集摄影部分。', 'Photographs of birds and small moments in their surroundings, rooted in nature observation. Further selections appear in the original portfolio.'),
        bullets: [], links: [portfolio]
      },
      {
        id: 'event-photography', title: pair('会议与活动摄影', 'Conference & Event Photography'),
        kind: pair('现场记录', 'Event documentation'),
        summary: pair('记录活动现场、人物与交流情境，与文案和视觉设计共同服务内容传播。', 'Documented events, people and exchanges, supporting communication alongside copy and visual design.'),
        bullets: [], links: [portfolio]
      }
    ], resources: [portfolio]
  },
  VibeCoding: {
    label: 'VIBE CODING', title: 'Vibe Coding',
    subtitle: pair('把观察和创作需要做成交互', 'Turning observations and creative needs into interactions'),
    intro: pair('从自然形态的动态实验，到帮助角色创作的小工具，再到这座3D浮岛；用可运行的作品检验想法。', 'From an animated study of natural forms to a character-writing tool and this 3D island, working prototypes make ideas tangible.'),
    entries: [
      {
        id: 'tree-fireworks', title: pair('树上花火', 'Tree Fireworks'),
        kind: pair('p5.js交互艺术', 'Interactive art · p5.js'),
        summary: pair('把植物花冠转化为可触发的花火：滑过或点击后，花丝炸开、飘落，最终留下空茎。', 'Plant crowns become interactive fireworks: hovering or clicking releases filaments that burst, fall and leave bare stems.'),
        bullets: [
          pair('将静止、炸开、飘落和留白组织为动画状态。', 'Organized animation into resting, bursting, falling and empty-stem states.'),
          pair('用固定随机种子保持构图，便于比较不同参数的效果。', 'Kept the composition reproducible with a fixed random seed for parameter comparisons.'),
          pair('补充触摸交互、等比缩放与前端原理学习笔记。', 'Added touch interaction, proportional scaling and notes connecting the work to frontend concepts.')
        ], links: [resource('./content/demos/tree-fireworks.html', '打开树上花火（需联网）', 'Try Tree Fireworks (online)', 'demo')]
      },
      {
        id: 'oc-dice', title: pair('OC灵感骰子', 'OC Inspiration Dice'),
        kind: pair('角色创作工具', 'Character-writing tool'),
        summary: pair('用随机词条组合为原创角色提供创作起点，并把想保留的灵感收藏在本地。', 'Combines random prompts to offer starting points for original characters, with local collections for ideas worth keeping.'),
        bullets: [pair('围绕词库、随机组合与本地收藏组织交互。', 'Built the interaction around prompt banks, random combinations and local collections.')],
        links: [resource('./content/demos/oc-dice.html', '打开OC灵感骰子', 'Try OC Inspiration Dice', 'demo')]
      },
      {
        id: 'living-observatory', title: pair('浮岛观测站', 'The Living Observatory'),
        kind: pair('本地3D作品集 · 迭代中', 'Local 3D portfolio · In development'),
        summary: pair('当前网站的制作实践：把作品类别放进浮岛上的观测仪器、地图与桌面物件，让探索场景成为浏览作品的入口。', 'The making of this site: portfolio categories become instruments, maps and desk objects on a floating island, turning scene exploration into a route through the work.'),
        bullets: [
          pair('从参考方向到3D资产组装，反复调整植物、水体与工作区构图。', 'Iterated from visual references to assembled 3D assets, adjusting plants, water and the workspace composition.'),
          pair('围绕动物动作、镜头导航与作品入口做本地交互评审。', 'Reviewed animal motion, camera navigation and work entry points through local interaction iterations.')
        ], links: []
      }
    ], resources: []
  },
  Writing: {
    label: 'WRITING', title: 'Writing',
    subtitle: pair('阿茶 · 叙事、观察与短对话', 'Acha · Narrative, observation and dialogue'),
    intro: pair('以“阿茶”为笔名写小说、短篇、随笔和散文。下列作品为已有创作；PDF收录节选，完整作品可联系获取。', 'Fiction, short stories, essays and prose written as Acha. The PDF contains excerpts from existing work; complete texts are available on request.'),
    entries: [
      {
        id: 'human-and-robot', title: pair('《human and robot》', 'human and robot'),
        kind: pair('原创短篇 · 科幻与情感', 'Original short story · Science fiction and emotion'),
        summary: pair('从机器人第一人称出发，在日常观察中写自由、生命与爱。原文节选：“又或者在每个发愣的瞬间，我只是在想，那一滴雨水落在主人睫毛上会是什么模样？”', 'A robot’s first-person observations explore freedom, life and love. Translated excerpt: “Or perhaps, in every moment of staring into space, I was simply wondering what that raindrop would look like on my master’s eyelashes.”'),
        bullets: [], links: [writing]
      },
      {
        id: 'fiction-scenes', title: pair('《EARTH》与《Statue-making liquid》', 'EARTH & Statue-making liquid'),
        kind: pair('小说节选 · 动作、悬念与黑色幽默', 'Fiction excerpts · Action, suspense and dark humor'),
        summary: pair('《EARTH》用动作场面与短对话推进群像；《Statue-making liquid》以药剂设定、线索与结局形成悬疑和悲剧浪漫。', 'EARTH develops its ensemble through action scenes and short dialogue; Statue-making liquid uses a fictional reagent, clues and a closing reveal to build suspense and tragic romance.'),
        bullets: [], links: [writing]
      },
      {
        id: 'xishuangbanna', title: pair('《西双版纳游记》', 'Xishuangbanna Travel Notes'),
        kind: pair('散文 · 自然观察', 'Prose · Nature observation'),
        summary: pair('写走进雨林后的具体感受：板根、树皮、鸟鸣与泥土，把读过的自然知识和亲眼所见连接起来。', 'Concrete impressions of buttress roots, bark, birdsong and mud connect nature writing once read with life encountered firsthand.'),
        bullets: [pair('原文节选：“回来再看看，这世上其他生灵，都在怎样活着。”', 'Translated excerpt: “Come back and see again how the other living beings in this world live.”')],
        links: [writing]
      }
    ], resources: [writing, email]
  },
  Content: {
    label: 'CONTENT & OPERATIONS', title: 'Content & Operations',
    subtitle: pair('让知识找到合适的表达和受众', 'Finding the right expression and audience for knowledge'),
    intro: pair('从鸟类科普漫画到自然教育内容，参与选题、文案、视觉和发布，把观察受众与复盘融入日常工作。', 'From bird-education comics to nature-education content, work spans topics, copy, visuals and publishing, with audience observation and review informing the process.'),
    entries: [
      {
        id: 'beijing-feiyu', title: pair('北京飞羽 · 平平安安科普漫画', 'Beijing Feiyu · Pingping & An’an Science Comics'),
        kind: pair('宣传组组长 · 跨平台内容运营', 'Publicity team lead · Cross-platform content operations'),
        summary: pair('参与“幽默漫画讲硬核知识”的科普内容路线，负责系列选题、文案与跨平台发布，并承担部分公众号推送编辑和审核。', 'Worked on a science-comic approach combining humor with substantive knowledge, handling topics, copy and cross-platform publishing, plus editing and reviewing selected WeChat posts.'),
        bullets: [
          pair('“平平安安科普漫画”已有12篇系列推送，围绕鸟类知识与公众科普展开。', 'The Pingping & An’an series includes 12 posts centered on bird knowledge and public education.'),
          pair('观察评论区话题，针对公众号和小红书调整排版与内容节奏。', 'Observed discussion in comments and adapted layouts and pacing for WeChat and Xiaohongshu.'),
          pair('原始作品集收录系列内容、招新推送及SVG互动尝试。', 'The original portfolio documents the series, recruitment posts and an SVG interaction experiment.')
        ], links: [portfolio]
      },
      {
        id: 'nature-education', title: pair('自然教育与生态旅行运营', 'Nature Education & Ecological Travel Operations'),
        kind: pair('北京自然圈 · 产品运营与新媒体实习 · 2026.01-04', 'Beijing Ziranquan · Product operations & new-media internship · Jan-Apr 2026'),
        summary: pair('参与自然教育与生态旅行的内容传播和产品运营，涉及内容策略、文创选品、讲师协作与周度数据复盘。', 'Supported communication and product operations for nature education and ecological travel, including content strategy, merchandise selection, instructor coordination and weekly data review.'),
        bullets: [
          pair('通过竞品调研梳理开头与标题策略，跟踪内容和用户反馈。', 'Used competitor research to develop opening and headline approaches and track content and audience feedback.'),
          pair('按价格、调性、联动性与便携性评估选品，对接机构并整理讲师协作流程。', 'Assessed merchandise by price, tone, collaboration potential and portability; coordinated with organizations and documented instructor workflows.')
        ], links: [resume]
      }
    ], resources: [portfolio, resume]
  },
  Experience: {
    label: 'EXPERIENCE MAP', title: 'Experience Map',
    subtitle: pair('工科训练，内容实践，游戏与产品', 'Engineering training, content practice, games and products'),
    intro: pair('中国传媒大学通信工程本科，2027届。把系统拆解、内容表达与用户观察带到游戏策划和产品实践中。', 'Communication Engineering undergraduate at Communication University of China, class of 2027. Bringing system analysis, content expression and user observation to game design and product work.'),
    entries: [
      {
        id: 'education', title: pair('中国传媒大学 · 通信工程', 'Communication University of China · Communication Engineering'),
        kind: pair('本科 · 2023.09-2027.06（预计）', 'Undergraduate · Sep 2023-Jun 2027 (expected)'),
        summary: pair('从工科训练出发，发展关卡诊断、需求分析、竞品研究和内容创作能力。', 'Engineering training complemented by level diagnosis, needs analysis, competitor research and content creation.'),
        bullets: [], links: [resume]
      },
      {
        id: 'media-museum', title: pair('中国传媒大学传媒博物馆', 'Media Museum · Communication University of China'),
        kind: pair('科普教育岗 · 2025.09-2026.04', 'Science education role · Sep 2025-Apr 2026'),
        summary: pair('参与科普活动内容支持、宣传文案与视觉设计、现场用户服务及反馈收集。', 'Supported educational activities, promotional copy and visual design, visitor service and feedback collection.'),
        bullets: [pair('协助科普展览策划、用户需求调研与活动流程设计。', 'Assisted with educational exhibition planning, user research and activity-flow design.')],
        links: [resume]
      },
      {
        id: 'player-perspective', title: pair('玩家视角与策划练习', 'Player Perspective & Design Practice'),
        kind: pair('个人游戏经历', 'Personal game experience'),
        summary: pair('关注休闲解谜、叙事解谜、音游与二次元养成；边玩边思考关卡为什么好玩、玩家为什么继续，以及反馈如何促成投入。', 'Interested in casual and narrative puzzles, rhythm games and character progression; considers why levels are enjoyable, why players continue and how feedback sustains engagement.'),
        bullets: [pair('游戏经历作品集记录《雨世界》《锈湖》《Phigros》《Cytus II》等作品的机制与体验观察。', 'The game portfolio records observations on mechanics and experience in Rain World, Rusty Lake, Phigros, Cytus II and other games.')],
        links: [games]
      }
    ], resources: [resume, games]
  },
  Contact: {
    label: 'CONTACT', title: 'Contact',
    subtitle: pair('蒋维嘉 · 阿茶', 'Jiang Weijia · Acha'),
    intro: pair('希望参与游戏策划、AI产品与产品运营相关工作，也欢迎围绕内容创作和交互作品交流。', 'Interested in game design, AI products and product operations, and happy to discuss content creation and interactive work.'),
    entries: [
      {
        id: 'email', title: pair('邮箱', 'Email'), kind: pair('工作与创作联系', 'Work and creative inquiries'),
        summary: pair('jiangweijia_cuc@163.com', 'jiangweijia_cuc@163.com'),
        bullets: [pair('完整文字作品可通过邮件联系获取。', 'Complete writing samples are available by email.')], links: [email]
      }
    ], resources: [resume, email]
  }
};
