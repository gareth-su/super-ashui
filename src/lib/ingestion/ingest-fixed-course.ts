import fs from "node:fs/promises";
import path from "node:path";
import { Prisma, QuestionType } from "@prisma/client";
import { chunkText } from "@/lib/chunker/chunk-text";
import { getOrCreateDefaultSubject } from "@/lib/db/default-subject";
import { prisma } from "@/lib/db/prisma";
import { parseDocument } from "@/lib/parser/document-parser";

const SUPPORTED_EXTENSIONS = new Set([".pdf", ".doc", ".docx", ".ppt", ".pptx"]);

type ChapterSeed = {
  fileName: string;
  chapterTitle: string;
  summary: string;
  keyConcepts: string[];
  nodes: FrameworkNode[];
};

type FrameworkNode = {
  name: string;
  summary: string;
  children?: FrameworkNode[];
};

type CourseFramework = ReturnType<typeof buildFramework>;

const chapterSeeds: Record<string, Omit<ChapterSeed, "fileName" | "chapterTitle">> = {
  "02期货市场的运作机制.pdf": {
    summary:
      "本章是衍生金融工具课程的市场制度基础。学习目标不是只记住“期货是标准化远期”，而是理解期货市场如何通过合约标准化、交易所交易、保证金、逐日盯市、清算所和监管体系，把未来价格交易变成可流动、可清算、可控违约风险的市场机制。",
    keyConcepts: ["远期合约", "期货合约", "标准化合约", "保证金账户", "初始保证金", "维持保证金", "追加保证金通知", "逐日盯市", "结算价", "清算所", "中央对手方", "实物交割", "现金结算", "场外市场", "信用风险", "集中清算", "金融监管"],
    nodes: [
      {
        name: "一、远期与期货的经济本质",
        summary: "远期和期货都属于约定未来交易条件的衍生合约，核心功能是把未来价格风险提前显性化。区别在于远期更灵活但信用风险高，期货通过交易所制度把合约标准化、流动化和可清算化。",
        children: [
          {
            name: "1. 远期合约：场外、定制、信用风险集中",
            summary: "远期合约是在未来约定日期以约定价格买卖标的资产的场外协议，条款可由双方自由设计，适合个性化需求，但缺点是流动性较弱、提前退出困难、交易对手违约风险较高。",
            children: [
              { name: "多头", summary: "承诺未来买入标的资产。若到期现货价格高于约定价格，多头受益；若低于约定价格，多头受损。" },
              { name: "空头", summary: "承诺未来卖出标的资产。若到期现货价格低于约定价格，空头受益；若高于约定价格，空头受损。" },
              { name: "远期的制度缺陷", summary: "合约个性化导致二级市场不活跃；盈亏通常到期集中结算，风险会在合约存续期间积累。" },
            ],
          },
          {
            name: "2. 期货合约：标准化远期的制度升级",
            summary: "期货合约保留了“未来买卖”的经济本质，但通过交易所标准化条款、保证金、逐日盯市和清算所制度，降低了远期合约的信用风险与流动性问题。",
            children: [
              { name: "交易地点", summary: "期货主要在交易所集中交易；远期主要在场外由双方协商。" },
              { name: "合约条款", summary: "期货合约条款高度标准化；远期合约条款可定制。" },
              { name: "结算方式", summary: "期货通常每日结算盈亏；远期通常到期一次性结算。" },
              { name: "信用风险", summary: "期货由清算所作为中央对手方并配合保证金制度控制风险；远期主要依赖对手方信用。" },
            ],
          },
        ],
      },
      {
        name: "二、期货合约标准化条款",
        summary: "标准化是期货市场形成流动性的前提。交易所统一规定合约标的、合约规模、交割月份、交割地点、品质等级、报价方式和风险控制条款，使大量交易者可以买卖同一种合约。",
        children: [
          { name: "标的资产", summary: "规定合约对应的商品、金融资产或指数，例如农产品、能源、金属、外汇、国债、股票指数等。" },
          { name: "合约规模", summary: "规定一份期货合约代表多少单位标的资产。合约规模影响合约价值、保证金需求和套保时需要的合约数量。" },
          { name: "交割月份", summary: "规定合约到期和交割的月份。不同到期月份的期货合约可能因库存、利率、便利收益和市场预期不同而价格不同。" },
          { name: "交割地点与品质等级", summary: "对实物交割合约，交易所会规定可交割地点和标的质量标准，必要时还会设置升贴水调整。" },
          { name: "价格波动限制与持仓限制", summary: "交易所可设置每日价格涨跌停板和持仓限额，用于控制极端波动、操纵风险和系统性风险。" },
          { name: "标准化的权衡", summary: "标准化提高交易效率和流动性，但也意味着期货合约不一定与每个企业的现货风险完全匹配，这为后续基差风险和交叉套保埋下伏笔。" },
        ],
      },
      {
        name: "三、保证金制度与逐日盯市",
        summary: "保证金和逐日盯市是期货市场风险控制的核心。投资者不是一次性支付合约全额价值，而是缴纳履约担保，并根据每日结算价把盈亏及时反映到账户中。",
        children: [
          { name: "保证金账户", summary: "保证金是履约担保，不是购买标的资产的成本。期货具有杠杆特征，因为投资者只需缴纳合约价值的一小部分即可控制较大的名义头寸。" },
          { name: "初始保证金", summary: "开仓时必须存入的最低金额，用于覆盖正常市场波动下可能发生的损失。" },
          { name: "维持保证金", summary: "持仓期间账户余额必须维持的最低水平，通常低于初始保证金。" },
          { name: "追加保证金通知", summary: "当保证金余额低于维持保证金时，投资者需要补足至规定水平；若未补足，头寸可能被强制平仓。" },
          { name: "逐日盯市", summary: "每个交易日结束后，交易所根据结算价计算多空双方当日盈亏，盈利方账户增加，亏损方账户减少。" },
          { name: "风险释放", summary: "逐日盯市把到期可能集中爆发的违约风险拆分到每个交易日处理。" },
        ],
      },
      {
        name: "四、清算所与中央对手方机制",
        summary: "清算所是期货市场信用风险控制的制度核心。交易达成后，清算所介入并成为每个买方的卖方、每个卖方的买方，从而把双边信用风险转化为对清算体系的风险管理问题。",
        children: [
          { name: "中央对手方", summary: "买卖双方不再直接承担彼此违约风险，而是分别面对清算所履约。" },
          { name: "清算会员", summary: "清算所通常通过清算会员管理客户头寸、保证金和违约处理，形成分层风险管理结构。" },
          { name: "净额结算", summary: "同一会员的多笔交易可进行净额处理，降低资金占用和结算规模。" },
          { name: "违约处理", summary: "清算所依靠客户保证金、会员保证金、违约基金和其他风险资源处理违约事件。" },
          { name: "制度意义", summary: "清算所不是简单撮合中介，而是承担中央对手方职能的风险管理机构。" },
        ],
      },
      {
        name: "五、平仓、交割与到期收敛",
        summary: "大多数期货头寸并不会真正交割，而是在到期前通过反向交易平仓。但交割机制仍然重要，因为它约束期货价格与现货价格在到期时趋于一致。",
        children: [
          { name: "平仓", summary: "持有多头者卖出同一合约，持有空头者买入同一合约，即可了结期货头寸。" },
          { name: "实物交割", summary: "到期时按交易所规则交付标的资产，常见于商品期货和部分金融期货。" },
          { name: "现金结算", summary: "不交付实物，而是按最终结算价计算现金差额，常见于股指期货等合约。" },
          { name: "到期收敛", summary: "同一标的的期货价格与现货价格在到期日应趋于一致，否则会出现套利机会。" },
          { name: "交割月份风险", summary: "临近交割时，流动性、仓储、运输、可交割品质量等因素可能使合约表现更复杂。" },
        ],
      },
      {
        name: "六、场外衍生品市场与监管",
        summary: "场外市场允许交易双方定制合约，适合复杂或个性化风险管理需求，但透明度、流动性和信用风险控制要求更高。金融危机后，监管更强调集中清算、交易报告和资本约束。",
        children: [
          { name: "场外市场的优势", summary: "合约期限、名义本金、现金流结构、标的资产和担保安排都可以定制。" },
          { name: "场外市场的风险", summary: "交易不集中、报价不透明、提前退出成本高，且对手方信用风险更突出。" },
          { name: "信用支持安排", summary: "场外交易常通过抵押品、净额结算、信用支持附件和保证金安排降低信用风险。" },
          { name: "监管方向", summary: "监管关注集中清算、交易报告、资本要求、保证金要求和系统性风险监测。" },
        ],
      },
      {
        name: "七、本章学习抓手与易错点",
        summary: "本章应围绕“期货如何把远期合约制度化”来理解，而不是孤立背概念。",
        children: [
          { name: "保证金不是购买成本", summary: "保证金是履约担保，期货合约的名义价值通常远大于保证金。" },
          { name: "逐日盯市不是到期结算", summary: "逐日盯市每天结算盈亏，降低风险累积。" },
          { name: "清算所不是普通中介", summary: "清算所承担中央对手方职能，是风险控制核心。" },
          { name: "标准化既是优势也是限制", summary: "标准化提高流动性，但会导致套保中的合约不完全匹配问题。" },
        ],
      },
    ],
  },
  "03利用期货的对冲策略.pdf": {
    summary:
      "本章从“期货能交易未来价格”进一步走向风险管理应用，核心是理解企业、投资者和资产管理者如何用期货建立与现货风险相反的头寸。重点包括多头套保、空头套保、基差风险、交叉套保、最优套保比率、最优合约数量以及股票指数期货在组合 β 管理中的应用。",
    keyConcepts: ["套期保值", "多头套期保值", "空头套期保值", "基差", "基差风险", "交叉套期保值", "最小方差套保", "最优套保比率", "相关系数", "现货价格变化标准差", "期货价格变化标准差", "最优合约数量", "股票指数期货", "组合 β", "系统性风险"],
    nodes: [
      {
        name: "一、套期保值的核心思想",
        summary: "套期保值是用期货头寸抵消现货价格风险。它的目标是降低现金流或资产价值的不确定性，而不是追求期货头寸本身盈利。",
        children: [
          { name: "风险来源", summary: "企业或投资者已经拥有或预计将拥有现货风险敞口，未来价格的不利变动会影响采购成本、销售收入或投资组合价值。" },
          { name: "对冲方式", summary: "建立与现货风险方向相反的期货头寸，使现货损失尽量由期货盈利弥补，或使现货收益下降时由期货收益补偿。" },
          { name: "套保代价", summary: "套保降低不利价格变动风险，也可能放弃有利价格变动带来的额外收益。" },
          { name: "套保与投机区别", summary: "套保以降低已有或预期现货风险为目标；投机则主动承担价格风险以获取收益。" },
        ],
      },
      {
        name: "二、空头套期保值：未来卖出现货时锁定销售价格",
        summary: "空头套保适用于未来将卖出现货、担心价格下跌的情形。操作上先卖出期货，未来卖出现货时再买入期货平仓。",
        children: [
          { name: "适用场景", summary: "农产品生产者、矿产企业、库存持有者、出口商或已经持有某类资产并计划未来出售的主体。" },
          { name: "风险逻辑", summary: "若未来现货价格下跌，现货销售收入下降；但空头期货头寸会因期货价格下跌而盈利。" },
          { name: "结果直觉", summary: "空头套保把未来销售价格的大部分不确定性转化为当前较确定的锁价结果。" },
          { name: "注意事项", summary: "若现货价格上涨，企业现货收入增加，但期货空头会亏损，因此套保不是单向增加收益。" },
        ],
      },
      {
        name: "三、多头套期保值：未来买入现货时锁定采购成本",
        summary: "多头套保适用于未来将买入现货、担心价格上涨的情形。操作上先买入期货，未来采购现货时再卖出期货平仓。",
        children: [
          { name: "适用场景", summary: "制造企业未来采购原材料、航空公司未来采购燃油、进口商未来购买外汇、基金未来计划建仓。" },
          { name: "风险逻辑", summary: "若未来现货价格上涨，采购成本上升；但多头期货头寸会因期货价格上涨而盈利。" },
          { name: "结果直觉", summary: "多头套保把未来采购成本的大部分不确定性转化为当前较确定的成本水平。" },
          { name: "方向判断口诀", summary: "未来要买，怕涨，先买期货；未来要卖，怕跌，先卖期货。" },
        ],
      },
      {
        name: "四、基差与基差风险",
        summary: "基差是现货价格与期货价格的差额，通常写作 b = S - F。现实套保是否完美，关键取决于套保开始和结束时基差如何变化。",
        children: [
          { name: "基差定义", summary: "b = S - F，其中 S 是现货价格，F 是期货价格。基差可能为正、为负或接近零。" },
          { name: "基差走强", summary: "基差变大，即现货相对期货更强。基差变化会使实际锁定价格偏离预期。" },
          { name: "基差走弱", summary: "基差变小，即现货相对期货更弱。基差变化会使实际锁定价格偏离预期。" },
          { name: "到期收敛", summary: "同一标的在交割期附近现货价格和期货价格趋于一致，因此基差接近零；但多数套保会在到期前结束。" },
          { name: "基差风险来源", summary: "现货和期货标的不同、地点不同、品质不同、到期日不同、供需冲击不同，都会导致基差变化。" },
        ],
      },
      {
        name: "五、交叉套期保值",
        summary: "当没有与现货资产完全匹配的期货合约时，可以用相关性较高的期货合约进行交叉套保。交叉套保能降低风险，但会引入更明显的匹配误差。",
        children: [
          { name: "适用条件", summary: "被套保资产没有对应期货合约，或者对应合约流动性不足，但存在价格高度相关的替代期货。" },
          { name: "效果决定因素", summary: "现货价格变化与期货价格变化的相关性越高，交叉套保效果越好。" },
          { name: "额外风险", summary: "标的差异、地点差异、品质差异和期限差异会使期货盈亏无法完全抵消现货风险。" },
          { name: "学习连接", summary: "交叉套保引出最优套保比率：既然不是完全匹配，就不一定使用 1:1 的套保比例。" },
        ],
      },
      {
        name: "六、最优套保比率",
        summary: "最优套保比率回答“每单位现货风险应该配置多少期货头寸”。在最小方差框架下，常用公式为 h* = ρσS / σF。",
        children: [
          { name: "公式", summary: "h* = ρσS / σF，其中 ρ 是现货价格变化与期货价格变化的相关系数，σS 是现货价格变化标准差，σF 是期货价格变化标准差。" },
          { name: "经济含义", summary: "相关性越高、现货波动越大、期货波动越小，所需套保比例通常越高。" },
          { name: "为什么不一定等于 1", summary: "若现货和期货价格变化不完全同步，1:1 套保可能不是风险最小的组合。" },
          { name: "最小方差思想", summary: "目标不是预测价格方向，而是选择期货头寸规模，使套保组合价值变化的方差最小。" },
        ],
      },
      {
        name: "七、最优合约数量",
        summary: "最优合约数量把套保比例转化为实际交易的期货合约张数，常用公式为 N* = h* QA / QF。",
        children: [
          { name: "公式", summary: "N* = h* QA / QF，其中 QA 是被套保资产规模，QF 是一份期货合约对应的资产规模或合约价值。" },
          { name: "合约乘数", summary: "金融期货常用指数点位乘以合约乘数计算单份合约价值，不能只看指数点位。" },
          { name: "取整问题", summary: "实际交易中合约数量必须取整数，取整会带来轻微过度套保或不足套保。" },
          { name: "单位一致", summary: "QA 和 QF 必须使用一致的计量单位或价值口径，否则公式结果没有意义。" },
        ],
      },
      {
        name: "八、股票指数期货的组合风险管理",
        summary: "股票指数期货可用于管理投资组合的系统性风险。通过买入或卖出股指期货，投资者可以临时调整组合对市场指数的敏感度。",
        children: [
          { name: "组合 β", summary: "β 衡量投资组合对市场指数变动的敏感程度，是系统性风险暴露的核心指标。" },
          { name: "降低 β", summary: "若担心市场下跌，可卖出股指期货，降低组合市场暴露。" },
          { name: "提高 β", summary: "若希望临时增加市场暴露，可买入股指期货，而不必立即买入一篮子股票。" },
          { name: "目标 β 管理", summary: "根据组合价值、当前 β、目标 β 和单份期货合约价值计算需要买卖的合约数量。" },
        ],
      },
      {
        name: "九、本章学习抓手与易错点",
        summary: "本章应以“风险方向判断 + 基差风险 + 数量化套保”作为主线。",
        children: [
          { name: "套保目标不是保证盈利", summary: "套保是降低风险；若价格朝有利方向变化，期货头寸可能抵消部分现货收益。" },
          { name: "多头/空头方向容易反", summary: "未来买入现货用多头套保，未来卖出现货用空头套保。" },
          { name: "基差不是期货价格", summary: "基差是现货价格与期货价格之差，基差变化才是套保不完美的关键。" },
          { name: "套保比率与合约数量不同", summary: "h* 是比例，N* 是合约张数；两者公式和含义不能混淆。" },
        ],
      },
    ],
  },
  "04利率.pdf": {
    summary:
      "本章是衍生品定价的时间价值基础。学习重点不是孤立记忆各种利率名称，而是建立从复利、连续复利、零息利率、债券定价、收益率、平价收益率到远期利率和期限结构的完整贴现框架，为后续远期、期货、互换和期权定价提供统一语言。",
    keyConcepts: ["利率", "无风险利率", "国债利率", "LIBOR", "OIS", "回购利率", "复利频率", "有效年利率", "连续复利", "贴现因子", "零息利率", "债券定价", "到期收益率", "平价收益率", "远期利率", "期限结构", "收益率曲线"],
    nodes: [
      {
        name: "一、利率的经济含义与市场基准",
        summary: "利率是资金的时间价格，是比较不同时点现金流的基础。衍生品定价中的利率不是抽象数字，而是与信用风险、抵押安排、融资方式和市场基准密切相关。",
        children: [
          { name: "资金时间价值", summary: "今天的一元钱通常比未来的一元钱更有价值，因为今天的资金可以投资并产生收益。" },
          { name: "无风险利率", summary: "理论上指没有违约风险的投资收益率，常作为定价模型的基准，但现实中需要选择合适市场利率近似。" },
          { name: "国债利率", summary: "国债信用风险较低，常被视为低风险利率参考，但不同国家、期限和流动性条件下仍会有差异。" },
          { name: "LIBOR 与替代基准", summary: "LIBOR 曾长期作为浮动利率和衍生品定价基准，近年来逐步被更稳健的隔夜利率基准替代。" },
          { name: "OIS 与回购利率", summary: "OIS 和回购利率更接近有抵押或隔夜资金成本，在现代衍生品贴现中具有重要地位。" },
        ],
      },
      {
        name: "二、复利频率与终值计算",
        summary: "同一个名义利率，如果复利频率不同，最终累积金额不同。因此在金融计算中必须明确利率的计息频率。",
        children: [
          { name: "年复利", summary: "每年计息一次，利息在下一年才并入本金继续产生利息。" },
          { name: "半年、季度、月度复利", summary: "一年内计息次数越多，利息越早并入本金，实际收益率越高。" },
          { name: "名义利率", summary: "按约定复利频率报价的利率，不能脱离复利频率单独比较。" },
          { name: "有效年利率", summary: "把不同复利频率的名义利率转换为一年实际增长率，便于横向比较。" },
          { name: "学习重点", summary: "看到利率时必须问：期限多长、复利频率是多少、是否为连续复利。" },
        ],
      },
      {
        name: "三、连续复利",
        summary: "连续复利是复利频率趋于无穷的极限形式。它在衍生品定价中常用，因为指数函数形式简洁，便于处理远期价格、贴现和无套利关系。",
        children: [
          { name: "终值公式", summary: "若本金为 A，连续复利利率为 R，期限为 T，则终值为 A e^{RT}。" },
          { name: "现值公式", summary: "未来 T 时点收到 A，在连续复利利率 R 下的现值为 A e^{-RT}。" },
          { name: "离散转连续", summary: "若一年复利 m 次的名义利率为 Rm，可通过等价终值关系转换为连续复利利率。" },
          { name: "连续转离散", summary: "连续复利利率也可以转换为指定复利频率的等价名义利率，用于与市场报价比较。" },
          { name: "定价意义", summary: "连续复利让多期贴现、远期利率和无套利推导更简洁，是后续衍生品定价的常用语言。" },
        ],
      },
      {
        name: "四、零息利率与贴现因子",
        summary: "零息利率是从今天到某一未来期限、期间没有现金流的投资收益率。它对应单一现金流贴现，是构造利率期限结构的基础。",
        children: [
          { name: "零息债券", summary: "不支付中间票息，到期一次性支付本金，价格低于面值，收益来自折价回升。" },
          { name: "零息利率", summary: "与某一到期期限对应的即期利率，用于贴现同期限单一现金流。" },
          { name: "贴现因子", summary: "贴现因子表示未来 1 元现金流在今天值多少钱；连续复利下贴现因子为 e^{-RT}。" },
          { name: "多期限现金流", summary: "不同到期日现金流应使用对应期限的零息利率或贴现因子，而不是简单使用同一个平均利率。" },
        ],
      },
      {
        name: "五、债券定价与收益率",
        summary: "票息债券可以看成多个现金流的组合，债券价格等于所有未来票息和本金按相应利率贴现后的现值之和。",
        children: [
          { name: "现金流拆分", summary: "固定利率债券通常包含定期票息和到期本金，每个现金流都有自己的到期时间。" },
          { name: "债券现值", summary: "理论价格等于每期现金流现值之和；若使用零息曲线，应分别用对应期限零息利率贴现。" },
          { name: "到期收益率", summary: "到期收益率是使债券未来现金流现值等于市场价格的单一折现率。" },
          { name: "零息利率与到期收益率区别", summary: "零息利率是期限结构上的即期利率；到期收益率是把整只债券现金流压缩成一个平均折现率。" },
          { name: "价格与收益率反向", summary: "债券现金流固定时，市场收益率上升，贴现率提高，债券价格下降；收益率下降，债券价格上升。" },
        ],
      },
      {
        name: "六、平价收益率",
        summary: "平价收益率是使债券价格等于面值的票面利率水平。它常用于理解市场利率水平和构造收益率曲线。",
        children: [
          { name: "平价债券", summary: "当债券价格等于面值时，债券称为平价发行或平价交易。" },
          { name: "平价收益率定义", summary: "给定期限结构，能让债券按面值定价的票息率就是该期限的平价收益率。" },
          { name: "与票面利率关系", summary: "若票面利率等于市场要求收益率，债券通常接近平价；若高于市场收益率，债券溢价；若低于市场收益率，债券折价。" },
          { name: "学习意义", summary: "平价收益率把零息曲线转换为更接近债券市场报价习惯的利率指标。" },
        ],
      },
      {
        name: "七、远期利率",
        summary: "远期利率是当前市场期限结构隐含的未来某一期间利率。它来自无套利关系，不等于未来一定会实现的即期利率。",
        children: [
          { name: "无套利直觉", summary: "从 0 到 T2 一次性投资，应该与先投资到 T1、再按 T1 到 T2 的远期利率投资到 T2 在无套利条件下等价。" },
          { name: "连续复利公式", summary: "若 R1 是 T1 期限零息利率，R2 是 T2 期限零息利率，则 T1 到 T2 的远期利率 RF = (R2T2 - R1T1) / (T2 - T1)。" },
          { name: "远期利率含义", summary: "远期利率反映当前市场价格中隐含的未来期间资金价格，而不是对未来利率的确定承诺。" },
          { name: "定价用途", summary: "远期利率是利率远期、互换、浮动利率现金流估值和期限结构分析的重要基础。" },
        ],
      },
      {
        name: "八、期限结构与收益率曲线",
        summary: "利率期限结构描述不同期限利率之间的关系，通常用收益率曲线表示。它是固定收益和利率衍生品定价的基础地图。",
        children: [
          { name: "正常曲线", summary: "长期利率高于短期利率，常见于经济扩张或期限风险补偿较高的环境。" },
          { name: "倒挂曲线", summary: "短期利率高于长期利率，可能反映市场对未来降息或经济放缓的预期。" },
          { name: "平坦曲线", summary: "不同期限利率差异较小，可能出现在货币政策或经济预期转换阶段。" },
          { name: "衍生品连接", summary: "远期、期货、互换、债券和利率期权都需要期限结构来贴现现金流或推导远期价格。" },
        ],
      },
      {
        name: "九、本章学习抓手与易错点",
        summary: "本章的主线是“把未来现金流变成今天的价值”。所有利率概念最终都服务于现金流比较、贴现和无套利定价。",
        children: [
          { name: "利率必须说明复利频率", summary: "同一个数字在年复利、半年复利和连续复利下含义不同。" },
          { name: "连续复利和离散复利不能直接混用", summary: "使用公式前要确认利率口径一致。" },
          { name: "零息利率不等于到期收益率", summary: "零息利率对应单一到期现金流；到期收益率是整只债券的单一内部收益率。" },
          { name: "远期利率不是确定预测", summary: "远期利率是当前市场隐含利率，未来实际即期利率可能不同。" },
          { name: "债券现金流应按期限分别贴现", summary: "多期现金流不能随意用一个利率处理，除非明确是在使用到期收益率口径。" },
        ],
      },
    ],
  },
};

function chapterTitleFromFile(fileName: string) {
  return path.basename(fileName, path.extname(fileName));
}

function getSeededChapters() {
  return Object.entries(chapterSeeds).map(([fileName, seed]) => ({
    fileName,
    chapterTitle: chapterTitleFromFile(fileName),
    summary: seed.summary,
    keyConcepts: seed.keyConcepts,
    nodes: seed.nodes,
  }));
}

function trimNodes(nodes: FrameworkNode[], maxDepth: number, currentDepth = 1): FrameworkNode[] {
  return nodes.map((node) => ({
    name: node.name,
    summary: node.summary,
    children: currentDepth < maxDepth && node.children?.length ? trimNodes(node.children, maxDepth, currentDepth + 1) : undefined,
  }));
}

function buildFramework(detail: "CONCISE" | "DETAILED", chapters: ChapterSeed[]) {
  const detailed = detail === "DETAILED";

  return {
    title: "衍生金融工具知识框架",
    courseSummary:
      "本课程当前知识库由三章构成，形成“市场制度—风险管理—定价基础”的主线：第二章回答期货市场为什么能交易未来价格并控制违约风险；第三章回答如何用期货头寸管理现货价格风险；第四章回答未来现金流如何通过利率、贴现和期限结构进行比较与定价。",
    chapters: chapters.map((chapter) => ({
      chapterTitle: chapter.chapterTitle,
      sourceFile: chapter.fileName,
      summary: chapter.summary,
      keyConcepts: chapter.keyConcepts,
      nodes: detailed ? chapter.nodes : trimNodes(chapter.nodes, 2),
    })),
    overallFramework: {
      mainThread:
        "三章共同构成衍生金融工具的入门主线：先理解期货市场如何把远期交易标准化、清算化和风险可控化；再理解企业与投资者如何用期货把现货价格风险转移出去；最后建立利率与贴现框架，为远期、期货、互换和利率衍生品定价提供统一语言。",
      learningPath: [
        "先区分远期与期货，掌握多头、空头、合约价格、到期损益的基本语言。",
        "理解期货合约标准化条款如何提升流动性，同时也会带来与个性化现货风险不完全匹配的问题。",
        "掌握保证金、逐日盯市、结算价和追加保证金如何每日释放违约风险。",
        "理解清算所作为中央对手方如何改变交易双方的信用风险结构。",
        "进入套保章节后，先根据未来现货交易方向判断应采用多头套保还是空头套保。",
        "用基差解释为什么现实套保通常不能完全锁定价格。",
        "在交叉套保场景下，用最优套保比率和最优合约数量把风险管理数量化。",
        "用股票指数期货理解投资组合 β 管理和系统性风险调整。",
        "最后学习复利、连续复利、零息利率和远期利率，把未来现金流转化为现值语言。",
        "把三章合在一起，形成后续学习远期定价、期货定价、互换定价和利率衍生品的基础。",
      ],
      crossChapterRelations: [
        {
          from: "02期货市场的运作机制",
          to: "03利用期货的对冲策略",
          relation: "第二章提供期货合约、保证金、逐日盯市和清算机制的制度基础；第三章把这些合约用于锁定未来买卖价格和降低现货风险。",
        },
        {
          from: "03利用期货的对冲策略",
          to: "04利率",
          relation: "套保结果涉及未来现金流、资金占用和机会成本，第四章的贴现和利率工具提供衡量这些现金流价值的基础。",
        },
        {
          from: "02期货市场的运作机制",
          to: "04利率",
          relation: "期货价格、保证金资金成本、金融期货和远期价格关系都离不开利率，利率章节为理解衍生品定价提供时间价值框架。",
        },
      ],
      coreConceptMap: [
        {
          concept: "未来价格锁定",
          appearsIn: ["远期合约", "期货合约", "多头套保", "空头套保"],
          importance: "解释衍生品最基本的经济功能：今天约定未来交易条件，把未来价格风险提前管理。",
        },
        {
          concept: "信用风险控制",
          appearsIn: ["保证金", "逐日盯市", "清算所", "中央对手方"],
          importance: "解释期货市场相对于场外远期市场更安全、更标准化的制度原因。",
        },
        {
          concept: "基差风险",
          appearsIn: ["套期保值", "交叉套保", "到期收敛"],
          importance: "解释为什么套保可以降低风险，但通常不能完全消除风险。",
        },
        {
          concept: "最小方差思想",
          appearsIn: ["最优套保比率", "相关系数", "波动率", "最优合约数量"],
          importance: "把套保从方向判断推进到数量化风险管理。",
        },
        {
          concept: "现金流时间价值",
          appearsIn: ["复利", "连续复利", "零息利率", "贴现因子", "远期利率"],
          importance: "构成后续所有衍生品定价模型的基础语言。",
        },
      ],
    },
  };
}

export function getFixedCourseFramework(detail: "CONCISE" | "DETAILED"): CourseFramework {
  return buildFramework(detail, getSeededChapters());
}

function buildCheatsheet(chapters: ChapterSeed[]) {
  const chapterText = chapters
    .map(
      (chapter) => `## ${chapter.chapterTitle}\n\n### 核心定位\n${chapter.summary}\n\n### 必背概念\n${chapter.keyConcepts.map((item) => `- ${item}`).join("\n")}\n\n### 复习抓手\n${chapter.nodes
        .map((node) => `- ${node.name}：${node.summary}`)
        .join("\n")}`,
    )
    .join("\n\n");

  return `# 衍生金融工具速记提纲\n\n## 总主线\n市场机制解释“期货如何交易”，套期保值解释“期货如何管理风险”，利率解释“未来现金流如何折现和比较”。\n\n${chapterText}\n\n## 易错点\n- 不要把远期和期货混同：期货是标准化、交易所交易、每日结算的远期类合约。\n- 套期保值不是消灭所有风险：基差变化会造成套保结果偏离目标。\n- 最优套保比率不是固定等于 1，而取决于现货与期货价格变化的相关性和波动率。\n- 利率换算必须注意复利频率；连续复利和离散复利数值不可直接混用。\n- 远期利率不是未来一定实现的即期利率，而是当前期限结构隐含的期间利率。`;
}

function buildQuestions(chapters: ChapterSeed[], materialIdByFile: Map<string, string>) {
  return [
    {
      fileName: "02期货市场的运作机制.pdf",
      questionType: QuestionType.SHORT,
      stem: "说明期货合约相对于远期合约在交易机制上的主要特点。",
      answerJson: JSON.stringify({ answer: "期货合约是标准化合约，通常在交易所交易，并通过保证金、逐日盯市和清算所机制控制违约风险。" }),
      analysis: "回答应覆盖标准化、交易所交易、保证金、每日结算和清算所。",
    },
    {
      fileName: "02期货市场的运作机制.pdf",
      questionType: QuestionType.TF,
      stem: "期货交易中的逐日盯市可以把盈亏按日结算，从而降低违约风险。",
      optionsJson: JSON.stringify(["正确", "错误"]),
      answerJson: JSON.stringify({ answer: "正确" }),
      analysis: "逐日盯市使亏损方及时补足保证金，降低风险累积。",
    },
    {
      fileName: "03利用期货的对冲策略.pdf",
      questionType: QuestionType.SHORT,
      stem: "什么情况下应使用多头套期保值？什么情况下应使用空头套期保值？",
      answerJson: JSON.stringify({ answer: "未来需要买入资产、担心价格上涨时使用多头套保；未来需要卖出资产、担心价格下跌时使用空头套保。" }),
      analysis: "关键是根据未来现货头寸方向选择期货方向。",
    },
    {
      fileName: "03利用期货的对冲策略.pdf",
      questionType: QuestionType.SHORT,
      stem: "为什么套期保值通常不能完全消除风险？",
      answerJson: JSON.stringify({ answer: "因为存在基差风险，即现货价格与期货价格变化不完全同步，且被套保资产与期货标的、到期时间可能不完全匹配。" }),
      analysis: "应指出基差变化和交叉套保/到期不匹配。",
    },
    {
      fileName: "03利用期货的对冲策略.pdf",
      questionType: QuestionType.SHORT,
      stem: "最优套保比率 h* = ρσS/σF 中，ρ、σS、σF 分别表示什么？",
      answerJson: JSON.stringify({ answer: "ρ 表示现货价格变化与期货价格变化的相关系数，σS 表示现货价格变化的标准差，σF 表示期货价格变化的标准差。" }),
      analysis: "该公式用于使套保组合风险方差最小。",
    },
    {
      fileName: "04利率.pdf",
      questionType: QuestionType.SHORT,
      stem: "连续复利与离散复利的区别是什么？",
      answerJson: JSON.stringify({ answer: "离散复利按固定频率计息，连续复利是假设计息频率趋于无穷，终值可表示为 Ae^{RT}。" }),
      analysis: "需强调复利频率和终值公式差异。",
    },
    {
      fileName: "04利率.pdf",
      questionType: QuestionType.SHORT,
      stem: "什么是零息利率？它在债券定价中有什么作用？",
      answerJson: JSON.stringify({ answer: "零息利率是从现在到某一到期日、无中间现金流的投资收益率；债券定价时可用各期限零息利率贴现相应现金流。" }),
      analysis: "零息利率是贴现未来现金流的基础。",
    },
    {
      fileName: "04利率.pdf",
      questionType: QuestionType.SHORT,
      stem: "远期利率反映了什么？它与零息利率期限结构有什么关系？",
      answerJson: JSON.stringify({ answer: "远期利率反映当前市场隐含的未来某一期间资金价格，可由不同期限的零息利率推导出来。" }),
      analysis: "远期利率来自当前期限结构，不等同于未来必然实现的即期利率。",
    },
  ].map((q) => ({
    ...q,
    subjectId: "",
    materialId: materialIdByFile.get(q.fileName),
    autoGradable: q.questionType === QuestionType.TF,
    sourceCitationsJson: JSON.stringify([{ file: q.fileName, quote: chapters.find((chapter) => chapter.fileName === q.fileName)?.summary ?? q.fileName }]),
  }));
}

export async function ingestFixedCourse(sourceDir = path.resolve(process.cwd(), "..", "ppt")) {
  const subject = await getOrCreateDefaultSubject();
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => SUPPORTED_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "zh-CN"));

  await prisma.$transaction([
    prisma.practiceAnswer.deleteMany({ where: { question: { subjectId: subject.id } } }),
    prisma.practiceSession.deleteMany({ where: { subjectId: subject.id } }),
    prisma.question.deleteMany({ where: { subjectId: subject.id } }),
    prisma.knowledgeArtifact.deleteMany({ where: { subjectId: subject.id } }),
    prisma.job.deleteMany({ where: { subjectId: subject.id } }),
    prisma.material.deleteMany({ where: { subjectId: subject.id } }),
  ]);

  let succeeded = 0;
  let failed = 0;
  const failures: Array<{ file: string; error: string }> = [];
  const chapters: ChapterSeed[] = [];
  const materialIdByFile = new Map<string, string>();

  for (const fileName of files) {
    const filePath = path.join(sourceDir, fileName);
    const material = await prisma.material.create({
      data: {
        subjectId: subject.id,
        title: fileName,
        filePath,
        mimeType: null,
        uploadStatus: "STORED",
        parseStatus: "PARSING",
        parseError: null,
      },
    });
    materialIdByFile.set(fileName, material.id);

    try {
      const sections = await parseDocument(filePath);
      const chunks = chunkText(
        sections
          .filter((section) => section.text.trim().length > 0)
          .map((section, index) => ({
            content: section.text,
            sourcePage: section.page ?? index + 1,
            sourceSection: section.section,
          })),
      );

      await prisma.materialChunk.createMany({
        data: chunks.map((chunk) => ({
          materialId: material.id,
          chunkIndex: chunk.chunkIndex,
          content: chunk.content,
          tokenCount: chunk.tokenCount,
          sourcePage: chunk.sourcePage ?? null,
          sourceSection: chunk.sourceSection ?? null,
          contentType: chunk.contentType ?? null,
        })),
      });

      await prisma.material.update({ where: { id: material.id }, data: { parseStatus: "SUCCESS", parseError: null } });

      const seed = chapterSeeds[fileName];
      chapters.push({
        fileName,
        chapterTitle: chapterTitleFromFile(fileName),
        summary: seed?.summary ?? `${chapterTitleFromFile(fileName)}章节资料已解析。`,
        keyConcepts: seed?.keyConcepts ?? [chapterTitleFromFile(fileName)],
        nodes: seed?.nodes ?? [{ name: chapterTitleFromFile(fileName), summary: `${chapterTitleFromFile(fileName)}章节内容。` }],
      });
      succeeded += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "解析失败";
      await prisma.material.update({ where: { id: material.id }, data: { parseStatus: "FAILED", parseError: message } });
      failed += 1;
      failures.push({ file: fileName, error: message });
    }
  }

  const frameworkConcise = JSON.stringify(buildFramework("CONCISE", chapters), null, 2);
  const frameworkDetailed = JSON.stringify(buildFramework("DETAILED", chapters), null, 2);
  const cheatsheet = buildCheatsheet(chapters);

  await prisma.knowledgeArtifact.createMany({
    data: [
      { subjectId: subject.id, type: "C1_FRAMEWORK", detailLevel: "CONCISE", version: 1, contentJson: frameworkConcise },
      { subjectId: subject.id, type: "C1_FRAMEWORK", detailLevel: "DETAILED", version: 1, contentJson: frameworkDetailed },
      { subjectId: subject.id, type: "C4_CHEATSHEET", detailLevel: "CONCISE", version: 1, contentMd: cheatsheet },
      { subjectId: subject.id, type: "C4_CHEATSHEET", detailLevel: "DETAILED", version: 1, contentMd: cheatsheet },
    ],
  });

  const questions = buildQuestions(chapters, materialIdByFile).map((question) => ({ ...question, subjectId: subject.id }));
  await prisma.question.createMany({
    data: questions.map((question) => ({
      subjectId: question.subjectId,
      materialId: question.materialId,
      questionType: question.questionType,
      stem: question.stem,
      optionsJson: question.optionsJson ?? null,
      answerJson: question.answerJson,
      analysis: question.analysis,
      difficulty: 2,
      autoGradable: question.autoGradable,
      sourceCitationsJson: question.sourceCitationsJson,
    })) satisfies Prisma.QuestionCreateManyInput[],
  });

  return {
    sourceDir,
    scanned: files.length,
    succeeded,
    failed,
    failures,
    chapters: chapters.map((chapter) => chapter.chapterTitle),
  };
}
