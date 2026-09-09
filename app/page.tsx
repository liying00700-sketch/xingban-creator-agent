"use client";

import { useEffect, useRef, useState } from "react";
import { renderScriptVideo, type RenderedScriptVideo, type ScriptVideoAsset } from "./video-renderer";

type View = "today" | "opportunities" | "studio" | "video" | "review" | "settlement" | "pet" | "profile";
type ApplicationState = "idle" | "draft" | "submitted";
type AgentStatus = "checking" | "ready" | "thinking" | "unconfigured" | "error";
type ChatMessage = { role: "agent" | "user"; text: string; streaming?: boolean; error?: boolean };
type SheetKind = "notifications" | "invitations" | "relationship" | "collaboration" | "brief" | "compliance" | "privacy" | "videoMenu" | "evidence" | "profile" | "publish" | "contentDetail" | "application" | null;
type Product = {
  id: string;
  code: string;
  name: string;
  category: string;
  stage: string;
  commission: string;
  fee: string;
  deadline: string;
  fit: "非常适合" | "值得尝试";
  fitClass: string;
  audience: string;
  reasons: string[];
  tags: string[];
  palette: string;
};

type BrandInvitation = {
  id: string;
  productId: Product["id"];
  title: string;
  campaign: string;
  reward: string;
  receivedAt: string;
  deadline: string;
  fit: Product["fit"];
};

type CollaborationRecord = {
  id: string;
  productId: Product["id"];
  title: string;
  campaign: string;
  stageIndex: number;
  status: string;
  updatedAt: string;
  nextAction: string;
  targetView: View;
};

type CommissionStatus = "待确认" | "可提现" | "处理中" | "已结算";

type CommissionRecord = {
  id: string;
  productId: Product["id"];
  title: string;
  campaign: string;
  channel: string;
  period: "2026年9月" | "2026年8月" | "2026年7月";
  orderWindow: string;
  attributedSales: number;
  commissionRate: number;
  refundAdjustment: number;
  bonusAdjustment: number;
  commission: number;
  status: CommissionStatus;
  expectedAt: string;
  settlementNo: string;
};

type ScriptDraft = {
  version: number;
  hook: string;
  beats: { time: string; label: string; copy: string; direction: string }[];
};

type PetGameState = {
  adopted: boolean;
  name: string;
  level: number;
  experience: number;
  fullness: number;
  food: number;
  claimedRewards: string[];
  equippedOutfit: string | null;
  equippedDecor: string | null;
};

const products: Product[] = [
  {
    id: "s12",
    code: "S12",
    name: "S12 Pro 穿戴式吸奶器",
    category: "母婴科技",
    stage: "新品种草",
    commission: "12% 佣金",
    fee: "$650–900",
    deadline: "9月18日",
    fit: "非常适合",
    fitClass: "strong",
    audience: "你的 25–34 岁新手妈妈粉丝占比高，近 30 天‘夜间育儿’内容收藏率突出。",
    reasons: ["人群高度重合", "生活流内容表现好", "有母乳喂养真实经验"],
    tags: ["1 条 TikTok", "30–45 秒", "可寄样"],
    palette: "mint",
  },
  {
    id: "klean",
    code: "K5",
    name: "KleanPal Pro 奶瓶清洗机",
    category: "喂养清洁",
    stage: "场景教育",
    commission: "10% 佣金",
    fee: "$500–750",
    deadline: "9月22日",
    fit: "非常适合",
    fitClass: "strong",
    audience: "你的‘睡前收拾’系列平均完播率高于账号均值，适合展示省时清洁流程。",
    reasons: ["场景天然契合", "高完播内容结构", "评论需求明确"],
    tags: ["1 条 Reels", "45–60 秒", "产品置换"],
    palette: "sand",
  },
  {
    id: "e12",
    code: "E12",
    name: "Ergonomic 婴儿背带",
    category: "出行装备",
    stage: "口碑扩散",
    commission: "15% 佣金",
    fee: "$350–600",
    deadline: "9月26日",
    fit: "值得尝试",
    fitClass: "medium",
    audience: "受众匹配，但你的户外亲子内容样本较少；可以用‘一人带娃出门’切入。",
    reasons: ["受众吻合", "佣金空间高", "需要补充户外案例"],
    tags: ["2 条短视频", "UGC 授权", "可寄样"],
    palette: "peach",
  },
];

const brandInvitations: BrandInvitation[] = [
  { id: "invite-s12", productId: "s12", title: "S12 Pro 新品首发合作", campaign: "Momcozy · 官方主动邀请", reward: "$650–900 + 12% 佣金", receivedAt: "10 分钟前", deadline: "4 天后截止", fit: "非常适合" },
  { id: "invite-klean", productId: "klean", title: "KleanPal 夜间清洁主题", campaign: "Momcozy · 内容共创邀请", reward: "$500–750 + 10% 佣金", receivedAt: "昨天", deadline: "8 天后截止", fit: "非常适合" },
  { id: "invite-e12", productId: "e12", title: "E12 一人带娃出行计划", campaign: "Momcozy · 定向体验邀请", reward: "$350–600 + 15% 佣金", receivedAt: "3 天前", deadline: "12 天后截止", fit: "值得尝试" },
];

const collaborationStages = ["建联", "合作", "发样", "上线视频", "完成"];

const collaborationRecords: CollaborationRecord[] = [
  { id: "collab-klean-fall", productId: "klean", title: "KleanPal 夜间清洁", campaign: "秋季育儿效率计划", stageIndex: 3, status: "视频已上线，正在累计 7 天表现", updatedAt: "今天 10:20", nextAction: "查看首日数据", targetView: "review" },
  { id: "collab-s12-launch", productId: "s12", title: "S12 Pro 新品首发", campaign: "新品种草 · TikTok", stageIndex: 2, status: "样品运输中，预计明天送达", updatedAt: "今天 09:12", nextAction: "提前准备脚本", targetView: "studio" },
  { id: "collab-e12-travel", productId: "e12", title: "E12 一人带娃出行", campaign: "定向体验 · Reels", stageIndex: 1, status: "合作已确认，等待收货地址确认", updatedAt: "昨天 16:40", nextAction: "确认合作信息", targetView: "opportunities" },
  { id: "collab-s12-spring", productId: "s12", title: "S12 春季真实体验", campaign: "母亲节内容计划", stageIndex: 4, status: "合作已完成并结算 $1,248", updatedAt: "8 月 18 日", nextAction: "复用高表现结构", targetView: "review" },
];

const commissionRecords: CommissionRecord[] = [
  { id: "pay-s12-spring", productId: "s12", title: "S12 春季真实体验", campaign: "母亲节内容计划", channel: "TikTok Shop", period: "2026年9月", orderWindow: "8月1日–8月31日", attributedSales: 6233, commissionRate: 12, refundAdjustment: 0, bonusAdjustment: 0, commission: 748, status: "可提现", expectedAt: "申请后 1–3 个工作日", settlementNo: "MC-240831-0186" },
  { id: "pay-klean-night", productId: "klean", title: "KleanPal 夜间清洁", campaign: "秋季育儿效率计划", channel: "Instagram Affiliate", period: "2026年9月", orderWindow: "8月18日–9月1日", attributedSales: 3380, commissionRate: 10, refundAdjustment: 0, bonusAdjustment: 0, commission: 338, status: "可提现", expectedAt: "申请后 1–3 个工作日", settlementNo: "MC-240901-0214" },
  { id: "pay-s12-launch", productId: "s12", title: "S12 Pro 新品首发", campaign: "新品种草 · TikTok", channel: "TikTok Shop", period: "2026年9月", orderWindow: "9月2日–9月8日", attributedSales: 1817, commissionRate: 12, refundAdjustment: -20, bonusAdjustment: 0, commission: 198, status: "待确认", expectedAt: "预计 9月16日确认", settlementNo: "MC-240908-0231" },
  { id: "pay-e12-travel", productId: "e12", title: "E12 一人带娃出行", campaign: "定向体验 · Reels", channel: "Momcozy Affiliate", period: "2026年9月", orderWindow: "7月15日–7月31日", attributedSales: 1840, commissionRate: 15, refundAdjustment: 0, bonusAdjustment: 0, commission: 276, status: "处理中", expectedAt: "预计 9月11日到账", settlementNo: "MC-240731-0148" },
  { id: "pay-s12-night", productId: "s12", title: "凌晨喂奶真实记录", campaign: "夏季夜间育儿计划", channel: "TikTok Shop", period: "2026年8月", orderWindow: "6月1日–6月30日", attributedSales: 5120, commissionRate: 12, refundAdjustment: -14, bonusAdjustment: 24, commission: 624, status: "已结算", expectedAt: "8月5日已到账", settlementNo: "MC-240630-0102" },
  { id: "pay-klean-routine", productId: "klean", title: "睡前 15 分钟重启", campaign: "家庭清洁共创", channel: "Instagram Affiliate", period: "2026年7月", orderWindow: "5月1日–5月31日", attributedSales: 5120, commissionRate: 10, refundAdjustment: 0, bonusAdjustment: 0, commission: 512, status: "已结算", expectedAt: "7月6日已到账", settlementNo: "MC-240531-0087" },
];

const commissionSummary = {
  estimated: 1284,
  pending: commissionRecords.filter((record) => record.status === "待确认").reduce((sum, record) => sum + record.commission, 0),
  available: commissionRecords.filter((record) => record.status === "可提现").reduce((sum, record) => sum + record.commission, 0),
  processing: commissionRecords.filter((record) => record.status === "处理中").reduce((sum, record) => sum + record.commission, 0),
  paidLifetime: 7864,
};

function formatUsd(value: number) {
  return `$${value.toLocaleString("en-US")}`;
}

const petMilestones = [
  { id: "adopt", score: 60, type: "属性 + 宠物", title: "信任感知", description: "解锁亲密属性，并获得数字宠物领养资格。" },
  { id: "food", score: 70, type: "宠物粮", title: "星星饼干 ×3", description: "喂养后增加饱食度与成长经验。" },
  { id: "scarf", score: 80, type: "服装", title: "珊瑚小围巾", description: "Momcozy 默契伙伴限定装扮。" },
  { id: "moon-bed", score: 90, type: "装饰", title: "月亮小窝", description: "布置宠物房间，解锁安睡互动。" },
  { id: "creator-crown", score: 95, type: "稀有装饰", title: "共创星环", description: "成为品牌共创者后的专属纪念。" },
];

const momcozyRelationshipInput = {
  collaborationMonths: 18,
  completedCollaborations: 4,
  repeatCollaborations: 2,
  onTimeRate: 96,
};

function calculateIntimacy(input: typeof momcozyRelationshipInput) {
  const timeScore = Math.min(60, input.collaborationMonths * 3);
  const collaborationBonus = Math.min(12, input.completedCollaborations * 3);
  const repeatBonus = Math.min(14, input.repeatCollaborations * 7);
  const trustBonus = input.onTimeRate >= 95 ? 8 : input.onTimeRate >= 85 ? 5 : 2;
  const score = Math.min(100, timeScore + collaborationBonus + repeatBonus + trustBonus);
  const level = score >= 95 ? "品牌共创者" : score >= 80 ? "默契伙伴" : score >= 60 ? "稳定合作" : "正在熟悉";
  return { score, level, timeScore, collaborationBonus, repeatBonus, trustBonus };
}

const momcozyRelationship = {
  ...momcozyRelationshipInput,
  ...calculateIntimacy(momcozyRelationshipInput),
  startedAt: "2025 年 3 月",
  nextLevelScore: 95,
};

const navItems: { id: View; label: string; icon: string; badge?: string }[] = [
  { id: "today", label: "今日", icon: "⌂" },
  { id: "opportunities", label: "合作机会", icon: "◇", badge: "3" },
  { id: "studio", label: "爆款创作", icon: "✦" },
  { id: "video", label: "AI 视频", icon: "▶" },
  { id: "review", label: "数据复盘", icon: "↗" },
  { id: "settlement", label: "佣金结算", icon: "$", badge: "2" },
  { id: "pet", label: "亲密养成", icon: "♡" },
];

const viewTitles: Record<View, { eyebrow: string; title: string; subtitle: string }> = {
  today: { eyebrow: "MONDAY · 09:24", title: "早上好，Mia", subtitle: "今天只做最值得做的事。" },
  opportunities: { eyebrow: "OPPORTUNITY MATCH", title: "为你精选的合作", subtitle: "每个推荐都有依据，你决定是否申请。" },
  studio: { eyebrow: "VIRAL CONTENT STUDIO", title: "把好产品讲成好内容", subtitle: "从真实受众信号出发，而不是套一个爆款模板。" },
  video: { eyebrow: "AI VIDEO LAB", title: "把脚本变成可发布视频", subtitle: "保留你的表达，AI 负责耗时的制作环节。" },
  review: { eyebrow: "GROWTH REVIEW", title: "看懂这次，拍好下一次", subtitle: "从内容表现到商业结果，给出明确的下一步。" },
  settlement: { eyebrow: "COMMISSION & PAYOUT", title: "佣金结算", subtitle: "每一笔收入，都算得清、追得到、提得走。" },
  pet: { eyebrow: "BONDING GARDEN", title: "亲密养成计划", subtitle: "把每一次可靠合作，变成看得见的共同成长。" },
  profile: { eyebrow: "CREATOR ASSET", title: "你的红人资产", subtitle: "让每次创作与合作，都变成可积累的职业信用。" },
};

const validViews: View[] = ["today", "opportunities", "studio", "video", "review", "settlement", "pet", "profile"];

const creativeProfiles: Record<string, {
  insightLead: string;
  insightAccent: string;
  proof: [string, string][];
  angles: { title: string; reason: string; detail: string }[];
  hooks: string[];
  beats: { time: string; label: string; copy: string; direction: string }[];
  caption: [string, string];
}> = {
  s12: {
    insightLead: "你最有机会打动人的，不是产品参数，是",
    insightAccent: "深夜的松一口气",
    proof: [["1.8×", "夜间场景完播"], ["+42", "求链接评论"], ["Top 12%", "同类收藏率"]],
    angles: [
      { title: "凌晨 3 点的真实崩溃", reason: "强共鸣", detail: "从不想吵醒宝宝，却需要开灯找设备的瞬间切入。" },
      { title: "新手妈妈少买一件没用的东西", reason: "强利益", detail: "用省时、安静、可移动三个场景回答购买焦虑。" },
      { title: "我坚持了 7 天才敢说", reason: "强信任", detail: "用连续体验而非开箱，建立真实使用证据。" },
    ],
    hooks: ["凌晨 3 点，我终于不用开灯找吸奶器了。", "这是我产后最不后悔的一次‘偷懒’。", "如果你也在夜里喂奶，先别划走。"],
    beats: [
      { time: "03–08s", label: "冲突", copy: "以前每次夜醒，我都要摸黑找零件，宝宝刚睡着又被吵醒。", direction: "保留环境音，不要配乐" },
      { time: "08–18s", label: "体验", copy: "这周我把 S12 Pro 放在床边，它不用手扶，我可以一边整理第二天的东西。", direction: "生活流跟拍 + 产品使用特写" },
      { time: "18–28s", label: "证据", copy: "最明显的是声音小、贴合稳，而且奶量在屏幕上就能看见。", direction: "用真实刻度画面，不做功效承诺" },
      { time: "28–35s", label: "行动", copy: "如果你也在经历夜间喂养，我把真实使用细节放在评论区。", direction: "看镜头，自然结束" },
    ],
    caption: ["凌晨 3 点", "终于不用开灯了"],
  },
  klean: {
    insightLead: "粉丝真正想要的，不是多一个机器，而是",
    insightAccent: "睡前收拾终于有终点",
    proof: [["1.6×", "收纳主题完播"], ["+31", "省时相关提问"], ["Top 18%", "家务内容收藏"]],
    angles: [
      { title: "宝宝睡后，我只想少洗一个奶瓶", reason: "强共鸣", detail: "用一天结束后的疲惫，带出自动清洗的真实价值。" },
      { title: "我的睡前 15 分钟重启法", reason: "强场景", detail: "把产品放进完整的夜间收拾流程里，而不是单独测评。" },
      { title: "用了 7 天，我最意外的不是洗得干净", reason: "强悬念", detail: "从时间感和台面秩序切入，避免只讲参数。" },
    ],
    hooks: ["宝宝睡了以后，我真的不想再洗一个奶瓶。", "这是我每天省下 20 分钟的地方。", "新手爸妈的晚上，不该结束在水池边。"],
    beats: [
      { time: "03–09s", label: "冲突", copy: "宝宝刚睡着，水池里还有一整天的奶瓶和配件。", direction: "手持扫过真实台面" },
      { time: "09–20s", label: "体验", copy: "我把奶瓶放进 KleanPal Pro，清洗、烘干和收纳一次完成。", direction: "保持动作连续，不快切" },
      { time: "20–34s", label: "证据", copy: "最直观的变化，是台面空了，我也能早点坐下来。", direction: "前后画面对比" },
      { time: "34–45s", label: "行动", copy: "如果你也讨厌睡前洗奶瓶，我把使用细节整理在评论区。", direction: "回到真人近景" },
    ],
    caption: ["宝宝睡后", "不再困在水池边"],
  },
  e12: {
    insightLead: "比‘解放双手’更有说服力的，是",
    insightAccent: "一个人也敢轻松出门",
    proof: [["1.4×", "出门主题互动"], ["+27", "背带相关提问"], ["15%", "合作佣金"]],
    angles: [
      { title: "第一次一个人带娃出门", reason: "强故事", detail: "记录从担心到顺利完成出门的完整情绪变化。" },
      { title: "楼下 20 分钟，也是我的恢复时间", reason: "强情绪", detail: "把背带放进妈妈恢复日常，而不是强调户外挑战。" },
      { title: "背带好不好，先看这三个动作", reason: "强实用", detail: "用穿戴、弯腰、安抚三个动作验证真实体验。" },
    ],
    hooks: ["今天是我第一次，一个人带宝宝出门。", "成为妈妈后，楼下 20 分钟也很珍贵。", "婴儿背带别只看颜值，先做这三个动作。"],
    beats: [
      { time: "03–08s", label: "目标", copy: "今天我想一个人带宝宝下楼买杯咖啡。", direction: "门口第一人称记录" },
      { time: "08–20s", label: "穿戴", copy: "E12 的支撑带可以先固定，再把宝宝抱进去，一个人也能完成。", direction: "完整展示动作，不跳步" },
      { time: "20–32s", label: "证据", copy: "走路、弯腰和坐下时，受力都比较稳定。", direction: "三个动作连续测试" },
      { time: "32–42s", label: "感受", copy: "这一趟很短，但它让我找回了一点自己的节奏。", direction: "户外自然光真人镜头" },
    ],
    caption: ["第一次", "一个人带娃出门"],
  },
};

const scriptRewrites: Record<string, string[]> = {
  s12: [
    "凌晨 3 点，宝宝刚睡，我以前最怕这时还要翻找一堆零件。",
    "现在我把 S12 Pro 固定放在床边，戴好后还能空出手准备下一次喂养。",
    "连续用了 7 个晚上，我最在意的声音、贴合和读数都能直接拍给你看。",
    "想看真实夜间使用细节，我会把最常被问的三个问题放在评论区。",
  ],
  klean: [
    "一天结束后，真正让我崩溃的，是水池里还堆着下一轮要用的奶瓶。",
    "我现在会把配件一起放进 KleanPal Pro，让清洗和烘干在我哄睡时完成。",
    "不是为了追求空台面，而是睡前终于不用再给自己加一轮家务。",
    "评论区问得最多的容量和清洁步骤，我会用真实一晚的用量回答。",
  ],
  e12: [
    "今天我想试一次：不等家人帮忙，也能带宝宝轻松下楼。",
    "先固定支撑带，再把宝宝抱进去，这两个动作一个人就能完成。",
    "我会连续拍走路、弯腰和坐下，看看受力是不是真的稳定。",
    "如果你也不敢独自带娃出门，下一条我会回答不同月龄怎么调节。",
  ],
};

function createScriptDraft(productId: string, angle: number, version = 1): ScriptDraft {
  const profile = creativeProfiles[productId];
  const useRewrite = version % 2 === 0;
  return {
    version,
    hook: profile.hooks[(angle + version - 1) % profile.hooks.length],
    beats: profile.beats.map((beat, index) => ({
      ...beat,
      copy: useRewrite ? scriptRewrites[productId][index] : beat.copy,
    })),
  };
}

function getViewFromLocation(): View {
  if (typeof window === "undefined") return "today";
  const value = new URL(window.location.href).searchParams.get("view") as View | null;
  return value && validViews.includes(value) ? value : "today";
}

function getProductFromLocation(): Product {
  if (typeof window === "undefined") return products[0];
  const id = new URL(window.location.href).searchParams.get("product");
  return products.find((product) => product.id === id) ?? products[0];
}

function applicationDraft(product: Product) {
  const scene = product.id === "s12" ? "凌晨喂养" : product.id === "klean" ? "睡前清洁" : "独自带娃出门";
  return `你好，我是 Mia。我专注记录新手妈妈的真实育儿生活，近期与“${scene}”相关的内容获得了高收藏和明确的产品询问。我希望用真实生活场景，呈现 ${product.name} 如何让育儿流程更从容。`;
}

function Mark({ children, tone = "dark" }: { children: React.ReactNode; tone?: "dark" | "light" }) {
  return <span className={`mark mark-${tone}`}>{children}</span>;
}

function AppIcon({ symbol, accent = false }: { symbol: string; accent?: boolean }) {
  return <span className={`app-icon ${accent ? "app-icon-accent" : ""}`}>{symbol}</span>;
}

async function readAgentStream(response: Response, onText: (text: string) => void): Promise<string> {
  if (!response.body) throw new Error("没有收到模型回复，请重试。");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result = "";

  const consumeEvent = (block: string) => {
    const data = block
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");
    if (!data || data === "[DONE]") return;
    const event = JSON.parse(data) as { type?: string; delta?: string; response?: { error?: { message?: string } }; error?: { message?: string } };
    if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
      result += event.delta;
      onText(result);
    }
    if (event.type === "response.failed" || event.type === "error") {
      throw new Error(event.response?.error?.message || event.error?.message || "模型没有完成回复，请重试。");
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    buffer = buffer.replace(/\r\n/g, "\n");
    let boundary = buffer.indexOf("\n\n");
    while (boundary >= 0) {
      consumeEvent(buffer.slice(0, boundary));
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf("\n\n");
    }
    if (done) break;
  }
  if (buffer.trim()) consumeEvent(buffer);
  if (!result.trim()) throw new Error("模型返回了空内容，请重试。");
  return result;
}

export default function Home() {
  const [view, setView] = useState<View>("today");
  const [selectedProduct, setSelectedProduct] = useState<Product>(products[0]);
  const [applicationStates, setApplicationStates] = useState<Record<string, ApplicationState>>({});
  const [showApply, setShowApply] = useState(false);
  const [showAgent, setShowAgent] = useState(true);
  const [activeSheet, setActiveSheet] = useState<SheetKind>(null);
  const [toast, setToast] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [historyIndex, setHistoryIndex] = useState(0);
  const [maxHistoryIndex, setMaxHistoryIndex] = useState(0);
  const [creativeAngle, setCreativeAngle] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const [scriptDrafts, setScriptDrafts] = useState<Record<string, ScriptDraft>>({});
  const [selectedCollaborationId, setSelectedCollaborationId] = useState(collaborationRecords[0].id);
  const [completedTasks, setCompletedTasks] = useState<number[]>([3]);
  const [readInvitationIds, setReadInvitationIds] = useState<string[]>(["invite-klean"]);
  const [milestoneAdded, setMilestoneAdded] = useState(false);
  const [creatorProfile, setCreatorProfile] = useState({ name: "Mia Chen", bio: "真实记录新手妈妈的育儿生活，让好用的东西减少一点手忙脚乱。" });
  const [agentStatus, setAgentStatus] = useState<AgentStatus>("checking");
  const agentAbort = useRef<AbortController | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "agent", text: "你好，我是星伴。你可以直接问我选品、品牌合作、短视频脚本或数据复盘，我会结合你当前正在处理的任务回答。" },
  ]);

  useEffect(() => {
    const initialView = getViewFromLocation();
    const initialProduct = getProductFromLocation();
    const currentState = window.history.state;
    const initialIndex = currentState?.__xingban === true ? Number(currentState.index) || 0 : 0;
    window.history.replaceState({ __xingban: true, index: initialIndex }, "", window.location.href);
    const initialSync = window.setTimeout(() => {
      setView(initialView);
      setSelectedProduct(initialProduct);
      setHistoryIndex(initialIndex);
      setMaxHistoryIndex(initialIndex);
    }, 0);

    const handlePopState = (event: PopStateEvent) => {
      const nextIndex = event.state?.__xingban === true ? Number(event.state.index) || 0 : 0;
      setHistoryIndex(nextIndex);
      setView(getViewFromLocation());
      setSelectedProduct(getProductFromLocation());
      setShowApply(false);
      setActiveSheet(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.clearTimeout(initialSync);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    let active = true;
    fetch("/api/agent", { headers: { Accept: "application/json" } })
      .then((response) => response.json())
      .then((data: { configured?: boolean }) => {
        if (active) setAgentStatus(data.configured ? "ready" : "unconfigured");
      })
      .catch(() => {
        if (active) setAgentStatus("error");
      });
    return () => {
      active = false;
      agentAbort.current?.abort();
    };
  }, []);

  const goTo = (next: View, product = selectedProduct) => {
    if (product.id !== selectedProduct.id) {
      setSelectedProduct(product);
      setCreativeAngle(0);
      setVideoReady(false);
    }
    if (next === view) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const nextIndex = historyIndex + 1;
    const url = new URL(window.location.href);
    if (next === "today") {
      url.searchParams.delete("view");
      url.searchParams.delete("product");
    } else {
      url.searchParams.set("view", next);
      if (["opportunities", "studio", "video"].includes(next)) url.searchParams.set("product", product.id);
      else url.searchParams.delete("product");
    }
    window.history.pushState({ __xingban: true, index: nextIndex }, "", url);
    setHistoryIndex(nextIndex);
    setMaxHistoryIndex(nextIndex);
    setView(next);
    setShowApply(false);
    setActiveSheet(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openOpportunity = (product: Product) => {
    setSelectedProduct(product);
    setCreativeAngle(0);
    setVideoReady(false);
    goTo("opportunities", product);
  };

  const selectProduct = (product: Product) => {
    setSelectedProduct(product);
    setCreativeAngle(0);
    setVideoReady(false);
    const url = new URL(window.location.href);
    url.searchParams.set("product", product.id);
    window.history.replaceState({ __xingban: true, index: historyIndex }, "", url);
  };

  const applicationState = applicationStates[selectedProduct.id] ?? "idle";
  const unreadInvitationCount = brandInvitations.filter((invitation) => !readInvitationIds.includes(invitation.id)).length;

  const openBrandInvitation = (invitation: BrandInvitation) => {
    setReadInvitationIds((current) => current.includes(invitation.id) ? current : [...current, invitation.id]);
    setActiveSheet(null);
    const product = products.find((item) => item.id === invitation.productId);
    if (product) openOpportunity(product);
  };

  const selectCollaboration = (collaborationId: string) => {
    setSelectedCollaborationId(collaborationId);
    const collaboration = collaborationRecords.find((record) => record.id === collaborationId);
    const collaborationProduct = products.find((item) => item.id === collaboration?.productId);
    if (collaborationProduct) setSelectedProduct(collaborationProduct);
  };

  const openCollaboration = (collaborationId: string) => {
    selectCollaboration(collaborationId);
    setActiveSheet("collaboration");
  };

  const handleBack = () => {
    if (historyIndex > 0) window.history.back();
    else if (view !== "today") goTo("today");
  };

  const handleForward = () => {
    if (historyIndex < maxHistoryIndex) window.history.forward();
  };

  const sendMessage = async (preset?: string) => {
    const value = (preset || chatInput).trim();
    if (!value || agentStatus === "thinking") return;
    const userMessage: ChatMessage = { role: "user", text: value };
    const requestMessages = [...messages, userMessage]
      .filter((message) => !message.error && !message.streaming)
      .slice(-12)
      .map((message) => ({ role: message.role === "agent" ? "assistant" : "user", content: message.text }));

    setChatInput("");
    setAgentStatus("thinking");
    setMessages((current) => [...current, userMessage, { role: "agent", text: "", streaming: true }]);

    const controller = new AbortController();
    agentAbort.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 60_000);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({
          messages: requestMessages,
          context: {
            view,
            product: {
              id: selectedProduct.id,
              code: selectedProduct.code,
              name: selectedProduct.name,
              category: selectedProduct.category,
              reward: `${selectedProduct.fee} + ${selectedProduct.commission}`,
              tags: selectedProduct.tags,
            },
            applicationState,
            creativeAngle,
            brandSignals: {
              activeInvitations: brandInvitations.length,
              unreadInvitations: unreadInvitationCount,
              settlement: {
                estimatedCommission: commissionSummary.estimated,
                pendingCommission: commissionSummary.pending,
                availableCommission: commissionSummary.available,
                processingCommission: commissionSummary.processing,
              },
              momcozyRelationship: {
                collaborationMonths: momcozyRelationship.collaborationMonths,
                intimacyScore: momcozyRelationship.score,
                intimacyLevel: momcozyRelationship.level,
              },
            },
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null;
        throw new Error(payload?.error?.message || "AI 经纪人暂时无法回复，请稍后重试。");
      }

      const reply = await readAgentStream(response, (text) => {
        setMessages((current) => current.map((message, index) => index === current.length - 1 ? { role: "agent", text, streaming: true } : message));
      });
      setMessages((current) => current.map((message, index) => index === current.length - 1 ? { role: "agent", text: reply } : message));
      setAgentStatus("ready");
    } catch (error) {
      const message = error instanceof DOMException && error.name === "AbortError"
        ? "这次响应超时了，请重试。"
        : error instanceof Error
          ? error.message
          : "AI 经纪人暂时无法回复，请稍后重试。";
      setMessages((current) => current.map((item, index) => index === current.length - 1 ? { role: "agent", text: message, error: true } : item));
      setAgentStatus(message.includes("尚未配置") ? "unconfigured" : "error");
    } finally {
      window.clearTimeout(timeout);
      agentAbort.current = null;
    }
  };

  const scriptDraftKey = `${selectedProduct.id}:${creativeAngle}`;
  const scriptDraft = scriptDrafts[scriptDraftKey] ?? createScriptDraft(selectedProduct.id, creativeAngle);
  const updateScriptDraft = (draft: ScriptDraft) => {
    setScriptDrafts((current) => ({ ...current, [scriptDraftKey]: draft }));
    setVideoReady(false);
  };
  const regenerateScript = () => {
    updateScriptDraft(createScriptDraft(selectedProduct.id, creativeAngle, scriptDraft.version + 1));
    setToast(`脚本 V${scriptDraft.version + 1} 已生成，可继续修改`);
  };

  const header = viewTitles[view];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand-lockup" onClick={() => goTo("today")} aria-label="回到今日首页">
          <span className="brand-symbol"><i /><i /><i /></span>
          <span><strong>星伴</strong><small>CREATOR AGENT</small></span>
        </button>

        <nav className="main-nav" aria-label="主导航">
          <p className="nav-label">工作台</p>
          {navItems.map((item) => (
            <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => goTo(item.id)} aria-current={view === item.id ? "page" : undefined}>
              <AppIcon symbol={item.icon} />
              <span>{item.label}</span>
              {item.badge && <em>{item.badge}</em>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="week-card">
            <div className="week-card-top"><span>本周成长</span><strong>3/5</strong></div>
            <div className="progress-track"><i style={{ width: "60%" }} /></div>
            <p>再完成 2 项任务，解锁「稳定创作者」徽章</p>
          </div>
          <button className={`profile-mini ${view === "profile" ? "active" : ""}`} onClick={() => goTo("profile")}>
            <span className="avatar avatar-mia">M</span>
            <span><strong>{creatorProfile.name}</strong><small>@miamomlife</small></span>
            <b>···</b>
          </button>
        </div>
      </aside>

      <main className={`main-content ${showAgent ? "with-agent" : ""}`}>
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-symbol small"><i /><i /><i /></span><b>星伴</b></div>
          <div className="history-controls" aria-label="页面历史导航">
            <button onClick={handleBack} disabled={view === "today" && historyIndex === 0} aria-label="返回上一页">←</button>
            <button onClick={handleForward} disabled={historyIndex >= maxHistoryIndex} aria-label="前进到下一页">→</button>
          </div>
          <div className="page-heading">
            <span>{header.eyebrow}</span>
            <h1>{header.title}</h1>
            <p>{header.subtitle}</p>
          </div>
          <div className="top-actions">
            <button className="round-btn notification-btn" aria-label={`查看 Momcozy 主动邀请，${unreadInvitationCount} 条未读`} onClick={() => setActiveSheet("invitations")}>
              <span className="notification-count" aria-hidden="true">{unreadInvitationCount}</span>
            </button>
            <button className={`agent-toggle ${showAgent ? "active" : ""}`} onClick={() => setShowAgent(!showAgent)}>
              <Mark tone={showAgent ? "dark" : "light"}>✦</Mark>
              AI 经纪人
            </button>
          </div>
        </header>

        <section className="view-container">
          {!["today", "settlement", "pet", "profile"].includes(view) && (
            <JourneyBar
              view={view}
              applicationState={applicationState}
              videoReady={videoReady}
              onGo={goTo}
              onApply={() => applicationState === "submitted" ? setToast("这项合作已经提交申请") : setShowApply(true)}
            />
          )}
          {view === "today" && <TodayView onOpen={openOpportunity} onGo={goTo} onOpenSheet={setActiveSheet} onOpenCollaboration={openCollaboration} onAskCoach={(prompt) => { setShowAgent(true); void sendMessage(prompt); }} completedTasks={completedTasks} setCompletedTasks={setCompletedTasks} unreadInvitationCount={unreadInvitationCount} />}
          {view === "opportunities" && (
            <OpportunityView
              selected={selectedProduct}
              onSelect={selectProduct}
              onApply={() => applicationState === "submitted" ? setToast("申请已提交，可在合作进度中查看品牌回复") : setShowApply(true)}
              applicationState={applicationState}
              onGo={goTo}
              onOpenSheet={setActiveSheet}
            />
          )}
          {view === "studio" && <StudioView product={selectedProduct} angle={creativeAngle} onAngleChange={setCreativeAngle} draft={scriptDraft} onDraftChange={updateScriptDraft} onRegenerate={regenerateScript} onGo={goTo} notify={setToast} onOpenSheet={setActiveSheet} />}
          {view === "video" && <VideoView product={selectedProduct} angle={creativeAngle} draft={scriptDraft} ready={videoReady} setReady={setVideoReady} notify={setToast} onGo={goTo} onOpenSheet={setActiveSheet} />}
          {view === "review" && <ReviewView onGo={goTo} notify={setToast} onOpenSheet={setActiveSheet} />}
          {view === "settlement" && <SettlementView notify={setToast} />}
          {view === "pet" && <PetView intimacyScore={momcozyRelationship.score} notify={setToast} onViewRelationship={() => setActiveSheet("relationship")} />}
          {view === "profile" && <ProfileView profile={creatorProfile} notify={setToast} onOpenSheet={setActiveSheet} milestoneAdded={milestoneAdded} setMilestoneAdded={setMilestoneAdded} />}
        </section>
      </main>

      {showAgent && (
        <AgentPanel
          messages={messages}
          chatInput={chatInput}
          setChatInput={setChatInput}
          sendMessage={sendMessage}
          close={() => setShowAgent(false)}
          onGo={goTo}
          view={view}
          applicationState={applicationState}
          product={selectedProduct}
          status={agentStatus}
        />
      )}

      <nav className="mobile-nav" aria-label="移动端导航">
        {navItems.filter((item) => item.id !== "pet").map((item) => (
          <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => goTo(item.id)} aria-current={view === item.id ? "page" : undefined}>
            <AppIcon symbol={item.icon} />
            <span>{item.label.replace("合作机会", "机会").replace("爆款创作", "创作").replace("数据复盘", "复盘").replace("佣金结算", "结算")}</span>
          </button>
        ))}
      </nav>

      {showApply && (
        <ApplyModal
          product={selectedProduct}
          state={applicationState}
          onClose={() => setShowApply(false)}
          onEvidence={() => { setShowApply(false); setActiveSheet("evidence"); }}
          onDraft={() => {
            setApplicationStates((current) => ({ ...current, [selectedProduct.id]: "draft" }));
            setToast("AI 已生成申请草稿");
          }}
          onSubmit={() => {
            setApplicationStates((current) => ({ ...current, [selectedProduct.id]: "submitted" }));
            setShowApply(false);
            setToast("申请已提交，Momcozy 通常会在 2–3 个工作日内回复");
          }}
        />
      )}
      {activeSheet && <ActionSheet kind={activeSheet} product={selectedProduct} profile={creatorProfile} onProfileSave={setCreatorProfile} onClose={() => setActiveSheet(null)} onGo={goTo} notify={setToast} readInvitationIds={readInvitationIds} onOpenInvitation={openBrandInvitation} selectedCollaborationId={selectedCollaborationId} onSelectCollaboration={selectCollaboration} />}
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </div>
  );
}

function JourneyBar({ view, applicationState, videoReady, onGo, onApply }: {
  view: View;
  applicationState: ApplicationState;
  videoReady: boolean;
  onGo: (view: View) => void;
  onApply: () => void;
}) {
  const activeIndex = view === "opportunities" ? (applicationState === "idle" ? 0 : 1) : view === "studio" ? 2 : view === "video" ? 3 : 4;
  const steps = [
    { label: "选品", action: () => onGo("opportunities"), done: activeIndex > 0 },
    { label: "建联", action: onApply, done: applicationState === "submitted" },
    { label: "创作", action: () => onGo("studio"), done: activeIndex > 2 },
    { label: "视频", action: () => onGo("video"), done: videoReady || activeIndex > 3 },
    { label: "复盘", action: () => onGo("review"), done: false },
  ];
  return (
    <div className="journey-bar" data-testid="creator-journey" aria-label="合作成长路径">
      <div className="journey-copy"><span>当前合作路径</span><strong>从选品到复盘，每一步都可以回来修改</strong></div>
      <div className="journey-steps">
        {steps.map((step, index) => (
          <button key={step.label} className={`${index === activeIndex ? "active" : ""} ${step.done ? "done" : ""}`} onClick={step.action} aria-current={index === activeIndex ? "step" : undefined}>
            <span>{step.done ? "✓" : index + 1}</span><b>{step.label}</b>
          </button>
        ))}
      </div>
    </div>
  );
}

function TodayView({ onOpen, onGo, onOpenSheet, onOpenCollaboration, onAskCoach, completedTasks, setCompletedTasks, unreadInvitationCount }: {
  onOpen: (p: Product) => void;
  onGo: (v: View) => void;
  onOpenSheet: (kind: SheetKind) => void;
  onOpenCollaboration: (collaborationId: string) => void;
  onAskCoach: (prompt: string) => void;
  completedTasks: number[];
  setCompletedTasks: React.Dispatch<React.SetStateAction<number[]>>;
  unreadInvitationCount: number;
}) {
  const [activeTraining, setActiveTraining] = useState(0);
  const [completedTraining, setCompletedTraining] = useState<number[]>([1, 2]);
  const tasks = [
    { id: 1, label: "确认 S12 Pro 合作方向", meta: "合作机会 · 今天", view: "opportunities" as View },
    { id: 2, label: "完成开头 3 秒脚本", meta: "爆款创作 · 约 8 分钟", view: "studio" as View },
    { id: 3, label: "回复 Momcozy 补充信息", meta: "品牌建联 · 截止 18:00", view: "opportunities" as View },
  ].map((task) => ({ ...task, done: completedTasks.includes(task.id) }));
  const trainingPlans = [
    { title: "3 秒真人开场", ability: "镜头表现", duration: "3 分钟", prompt: "请作为我的短视频创作教练，基于我擅长的夜间育儿场景，带我完成一次 3 分钟的开场口播训练。先给任务，再一次只问我一个问题。" },
    { title: "场景冲突讲清楚", ability: "场景叙事", duration: "5 分钟", prompt: "请陪我训练如何在短视频前 8 秒讲清楚夜间育儿的具体冲突。给我一个情境，让我回答后再逐句点评。" },
    { title: "自然说出产品价值", ability: "商业表达", duration: "4 分钟", prompt: "请作为商业内容教练，训练我不罗列参数、只用真实体验自然说出产品价值。一次给我一个练习并点评。" },
  ];
  const toggleTask = (id: number) => setCompletedTasks((all) => all.includes(id) ? all.filter((taskId) => taskId !== id) : [...all, id]);
  const training = trainingPlans[activeTraining];

  return (
    <div className="today-grid">
      <div className="today-main">
        <section className="focus-card">
          <div className="focus-copy">
            <div className="card-kicker"><Mark>01</Mark><span>今日最优先</span></div>
            <h2>有一个很适合你的<br />Momcozy 新品合作</h2>
            <p>受众、内容风格和合作报价都在你的舒适区。申请窗口还剩 4 天。</p>
            <div className="fit-reasons">
              <span>母婴人群匹配</span><i />
              <span>内容风格契合</span><i />
              <span>预估收益 $650+</span>
            </div>
            <button className="primary-btn" onClick={() => onOpen(products[0])}>查看为什么适合我 <span>→</span></button>
          </div>
          <div className="focus-visual">
            <div className="brand-chip"><span>M</span> MOMCOZY</div>
            <div className="product-orbit orbit-one" />
            <div className="product-orbit orbit-two" />
            <div className="product-pod">
              <small>WEARABLE</small>
              <strong>S12</strong>
              <span>PRO</span>
            </div>
            <div className="match-stamp"><b>高度契合</b><span>3 项数据依据</span></div>
          </div>
        </section>

        <section className="section-block">
          <div className="section-title-row">
            <div><span className="section-eyebrow">TODAY&apos;S FLOW</span><h3>今天的成长清单</h3></div>
            <span className="time-hint">预计 24 分钟</span>
          </div>
          <div className="task-list">
            {tasks.map((task, index) => (
              <div className={`task-row ${task.done ? "done" : ""}`} key={task.id}>
                <button className="check-button" onClick={() => toggleTask(task.id)} aria-label={task.done ? "标记为未完成" : "标记为完成"}>{task.done ? "✓" : ""}</button>
                <span className="task-index">0{index + 1}</span>
                <button className="task-copy" onClick={() => onGo(task.view)}><strong>{task.label}</strong><small>{task.meta}</small></button>
                <button className="task-arrow" onClick={() => onGo(task.view)} aria-label="打开任务">↗</button>
              </div>
            ))}
          </div>
        </section>

        <section className="section-block incubation-section">
          <div className="section-title-row">
            <div><span className="section-eyebrow">CREATOR INCUBATION</span><h3>本周创作孵化</h3></div>
            <span className="time-hint">已完成 {completedTraining.length}/3</span>
          </div>
          <div className="incubation-layout">
            <div className="training-list">
              {trainingPlans.map((item, index) => (
                <button key={item.title} className={activeTraining === index ? "active" : ""} onClick={() => setActiveTraining(index)} aria-pressed={activeTraining === index}>
                  <span>{completedTraining.includes(index) ? "✓" : `0${index + 1}`}</span>
                  <div><strong>{item.title}</strong><small>{item.ability} · {item.duration}</small></div>
                  <i>→</i>
                </button>
              ))}
            </div>
            <div className="coach-card">
              <span><Mark tone="light">✦</Mark> 今日陪练</span>
              <h4>{training.title}</h4>
              <p>星伴会先给你一个具体情境，听完你的表达后逐句反馈；不是课程视频，而是一次真实练习。</p>
              <div className="coach-focus"><b>本次目标</b><span>让开场更像你本人，同时在 3 秒内说清处境与冲突。</span></div>
              <div className="coach-actions">
                <button onClick={() => { onAskCoach(training.prompt); setCompletedTraining((all) => all.includes(activeTraining) ? all : [...all, activeTraining]); }}>开始 AI 陪练</button>
                <button onClick={() => onGo("studio")}>带着训练写脚本 →</button>
              </div>
            </div>
          </div>
        </section>

        <section className="section-block pulse-section">
          <div className="section-title-row">
            <div><span className="section-eyebrow">CONTENT PULSE</span><h3>你的内容正在发生什么</h3></div>
            <button className="text-btn" onClick={() => onGo("review")}>查看完整复盘 →</button>
          </div>
          <div className="pulse-cards">
            <div className="pulse-card highlight">
              <span className="pulse-label">过去 7 天</span>
              <strong>+38%</strong>
              <p>平均观看时长</p>
              <small><b>↗</b> “夜间带娃”主题拉高了停留</small>
            </div>
            <div className="pulse-card">
              <span className="pulse-label">粉丝信号</span>
              <strong>126</strong>
              <p>条明确购买意向评论</p>
              <small>“求链接”比上周多 42 条</small>
            </div>
            <div className="pulse-card dark-card">
              <span className="pulse-label">AI 的发现</span>
              <p className="insight-copy">你的粉丝不是想看“产品测评”，而是想看它如何让深夜育儿少一点手忙脚乱。</p>
              <button onClick={() => onGo("studio")}>用这个洞察创作 <span>→</span></button>
            </div>
          </div>
        </section>
      </div>

      <aside className="today-rail">
        <button className="brand-invite-card" onClick={() => onOpenSheet("invitations")} aria-label={`查看 ${brandInvitations.length} 条 Momcozy 主动邀请，其中 ${unreadInvitationCount} 条未读`}>
          <span className="mini-eyebrow">MOMCOZY INVITES</span>
          <span className="invite-count-row"><strong>{brandInvitations.length}</strong><i>{unreadInvitationCount} 条未读</i></span>
          <b>品牌主动邀请</b>
          <small>查看合作方向、报价与截止时间</small>
          <em>查看全部 →</em>
        </button>
        <section className="mini-section commission-mini-card">
          <div className="mini-title"><span>佣金结算</span><em>2 笔可提现</em></div>
          <div className="commission-mini-balance"><span>可提现余额</span><strong>{formatUsd(commissionSummary.available)}</strong><small>{formatUsd(commissionSummary.pending)} 待品牌确认</small></div>
          <button onClick={() => onGo("settlement")}>查看明细并提现 <span>→</span></button>
        </section>
        <section className="mini-section relationship-card">
          <div className="mini-title"><span>Momcozy 亲密度</span><em>{momcozyRelationship.level}</em></div>
          <button className="intimacy-summary" onClick={() => onOpenSheet("relationship")} aria-label="查看 Momcozy 亲密度计算方式">
            <span className="intimacy-ring" style={{ "--intimacy": `${momcozyRelationship.score}%` } as React.CSSProperties}><strong>{momcozyRelationship.score}</strong><small>/ 100</small></span>
            <span className="intimacy-copy"><b>合作 {momcozyRelationship.collaborationMonths} 个月</b><small>时长贡献 {momcozyRelationship.timeScore} 分</small><em>查看计算方式 →</em></span>
          </button>
        </section>
        <section className="mini-section pet-preview-card">
          <div className="mini-title"><span>亲密养成计划</span><em>已解锁</em></div>
          <div className="pet-preview-content">
            <div className="pet-mini-room" aria-hidden="true"><span className="pet-mini-star">✦</span><CatAvatar mini scarf /></div>
            <div><strong>数字伙伴「糯米」</strong><small>亲密度 {momcozyRelationship.score} · 3 个里程碑已解锁</small><p>再提升 2 分，解锁月亮小窝。</p></div>
          </div>
          <button className="pet-entry-button" onClick={() => onGo("pet")}>进入养成小屋 <span>→</span></button>
        </section>
        <section className="mini-section">
          <div className="mini-title"><span>合作进度 · {collaborationRecords.length}</span><button onClick={() => onOpenCollaboration(collaborationRecords[0].id)}>全部</button></div>
          <div className="collaboration-record-list">
            {collaborationRecords.map((record) => (
              <button key={record.id} onClick={() => onOpenCollaboration(record.id)} aria-label={`查看合作进度：${record.title}`}>
                <span className={`collaboration-stage-dot ${record.stageIndex === collaborationStages.length - 1 ? "complete" : ""}`}>{record.stageIndex === collaborationStages.length - 1 ? "✓" : record.stageIndex + 1}</span>
                <span className="collaboration-record-copy"><strong>{record.title}</strong><small>{collaborationStages[record.stageIndex]} · {record.updatedAt}</small><i><b style={{ width: `${((record.stageIndex + 1) / collaborationStages.length) * 100}%` }} /></i></span>
                <em>›</em>
              </button>
            ))}
          </div>
        </section>
        <section className="mini-section score-card">
          <div className="mini-title"><span>创作者成长值</span><em>本周 +6</em></div>
          <div className="score-visual"><strong>78</strong><span>/ 100</span><i style={{ "--score": "78%" } as React.CSSProperties} /></div>
          <div className="score-legend"><span><i className="legend-a" />内容力 <b>82</b></span><span><i className="legend-b" />商业力 <b>74</b></span></div>
          <p>稳定交付 1 次合作，即可进入 Momcozy 优先合作池。</p>
        </section>
        <section className="quote-card">
          <Mark tone="light">✦</Mark>
          <blockquote>“你不需要像别人一样创作。你需要让自己的优势，被更多对的人看见。”</blockquote>
          <small>— 星伴 AI 经纪人</small>
        </section>
      </aside>
    </div>
  );
}

function OpportunityView({ selected, onSelect, onApply, applicationState, onGo, onOpenSheet }: {
  selected: Product; onSelect: (p: Product) => void; onApply: () => void; applicationState: ApplicationState; onGo: (v: View) => void; onOpenSheet: (kind: SheetKind) => void;
}) {
  const [filter, setFilter] = useState("全部");
  const matchesFilter = (product: Product, value: string) => value === "全部"
    || (value === "母婴" && ["母婴科技", "喂养清洁"].includes(product.category))
    || (value === "高佣金" && parseInt(product.commission) >= 12)
    || (value === "可寄样" && product.tags.includes("可寄样"));
  const filtered = products.filter((product) => matchesFilter(product, filter));
  const changeFilter = (value: string) => {
    setFilter(value);
    const next = products.filter((product) => matchesFilter(product, value));
    if (next.length && !next.some((product) => product.id === selected.id)) onSelect(next[0]);
  };
  return (
    <div className="opportunity-layout">
      <div className="opportunity-list-side">
        <div className="filter-row">
          {["全部", "母婴", "高佣金", "可寄样"].map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => changeFilter(item)} aria-pressed={filter === item}>{item}</button>)}
          <span>{filtered.length} 个适配机会</span>
        </div>
        <div className="opportunity-list">
          {filtered.map((product) => (
            <button className={`opportunity-card ${selected.id === product.id ? "selected" : ""}`} key={product.id} onClick={() => onSelect(product)} aria-pressed={selected.id === product.id}>
              <ProductThumb product={product} />
              <span className="opportunity-copy">
                <span className="opportunity-brand"><b>MOMCOZY</b><em className={product.fitClass}>{product.fit}</em></span>
                <strong>{product.name}</strong>
                <span className="opportunity-meta">{product.stage} · 截止 {product.deadline}</span>
                <span className="tag-row">{product.tags.slice(0, 2).map((tag) => <i key={tag}>{tag}</i>)}</span>
                <span className="pay-row"><b>{product.fee}</b><small>+ {product.commission}</small></span>
              </span>
              <span className="select-arrow">→</span>
            </button>
          ))}
        </div>
      </div>

      <aside className="opportunity-detail">
        <div className="detail-product-head">
          <ProductThumb product={selected} large />
          <div><span>MOMCOZY · {selected.category}</span><h2>{selected.name}</h2><div className="detail-tags"><i>{selected.fit}</i><i>官方合作</i></div></div>
        </div>
        <div className="agent-verdict">
          <div className="verdict-head"><Mark>✦</Mark><strong>星伴建议你申请</strong><span>信心：高</span></div>
          <p>{selected.audience}</p>
          <div className="reason-grid">{selected.reasons.map((reason, i) => <div key={reason}><span>0{i + 1}</span><p>{reason}</p></div>)}</div>
        </div>
        <div className="brief-block">
          <div className="brief-head"><h3>合作简报</h3><button onClick={() => onOpenSheet("brief")}>查看完整 Brief ↗</button></div>
          <dl>
            <div><dt>内容交付</dt><dd>{selected.tags[0]} · {selected.tags[1]}</dd></div>
            <div><dt>合作报酬</dt><dd>{selected.fee} + {selected.commission}</dd></div>
            <div><dt>内容方向</dt><dd>真实生活场景、第一人称体验、自然口播</dd></div>
            <div><dt>授权说明</dt><dd>品牌广告投放 30 天，不含竞品排他</dd></div>
          </dl>
        </div>
        <div className="risk-note"><b>!</b><p><strong>申请前提醒</strong><span>需要补充过去 60 天母婴内容的平均播放数据。</span></p></div>
        <div className="detail-actions">
          <button className="secondary-btn" onClick={() => onGo("studio")}>先看看怎么拍</button>
          <button className="primary-btn" onClick={() => applicationState === "submitted" ? onOpenSheet("application") : onApply()}>{applicationState === "submitted" ? "查看申请进度 →" : applicationState === "draft" ? "继续完成申请 →" : "让 AI 帮我申请 →"}</button>
        </div>
        <p className="human-note">申请材料会先由你确认，AI 不会自动对外发送。</p>
      </aside>
    </div>
  );
}

function ProductThumb({ product, large = false }: { product: Product; large?: boolean }) {
  return (
    <span className={`product-thumb ${product.palette} ${large ? "large" : ""}`}>
      <span className="thumb-ring" />
      <span className="thumb-device"><small>{product.code.slice(0, 1)}</small><strong>{product.code}</strong></span>
      <em>{product.category}</em>
    </span>
  );
}

function StudioView({ product, angle, draft, onDraftChange, onRegenerate, onAngleChange, onGo, notify, onOpenSheet }: {
  product: Product;
  angle: number;
  draft: ScriptDraft;
  onDraftChange: (draft: ScriptDraft) => void;
  onRegenerate: () => void;
  onAngleChange: (angle: number) => void;
  onGo: (v: View) => void;
  notify: (m: string) => void;
  onOpenSheet: (kind: SheetKind) => void;
}) {
  const [editing, setEditing] = useState(false);
  const profile = creativeProfiles[product.id];
  const refreshAngles = () => {
    onAngleChange((angle + 1) % profile.angles.length);
    notify("已根据最新趋势推荐下一个内容切角");
  };
  const updateBeat = (index: number, field: "copy" | "direction", value: string) => {
    onDraftChange({ ...draft, beats: draft.beats.map((beat, beatIndex) => beatIndex === index ? { ...beat, [field]: value } : beat) });
  };
  return (
    <div className="studio-layout" data-testid="studio-view">
      <section className="studio-context">
        <div className="selected-product-strip"><ProductThumb product={product} /><div><span>正在为这个合作创作</span><strong>{product.name}</strong></div><button onClick={() => onGo("opportunities")}>更换产品</button></div>
        <div className="signal-card">
          <span className="section-eyebrow">YOUR UNIQUE SIGNAL</span>
          <h2>{profile.insightLead}<br /><strong>{profile.insightAccent}</strong>。</h2>
          <p>来自你最近 12 条内容、126 条购买意向评论与 Momcozy 过往高表现内容的交叉分析。</p>
          <div className="signal-proof">{profile.proof.map(([value, label]) => <span key={label}><b>{value}</b>{label}</span>)}</div>
        </div>
        <div className="angle-section">
          <div className="section-title-row"><div><span className="section-eyebrow">CREATIVE ANGLES</span><h3>选择一个内容切角</h3></div><button className="text-btn" onClick={refreshAngles}>推荐下一个 ↻</button></div>
          <div className="angle-list">{profile.angles.map((item, i) => <button key={item.title} onClick={() => onAngleChange(i)} className={angle === i ? "active" : ""} aria-pressed={angle === i}><span>0{i + 1}</span><div><strong>{item.title}</strong><small>{item.detail}</small></div><em>{item.reason}</em></button>)}</div>
        </div>
      </section>
      <section className="script-panel">
        <div className="script-top"><div><span>{product.id === "e12" ? "42" : product.id === "klean" ? "45" : "35"} 秒短视频脚本 · V{draft.version}</span><h3>{profile.angles[angle].title}</h3></div><span className="saved-state">● 已自动保存</span></div>
        <div className={`hook-box ${editing ? "editing" : ""}`}><div><span>HOOK · 0–3s</span><button onClick={() => { const current = profile.hooks.indexOf(draft.hook); onDraftChange({ ...draft, hook: profile.hooks[(current + 1) % profile.hooks.length] }); }}>换一个 ↻</button></div>{editing ? <textarea aria-label="修改脚本开头" value={draft.hook} onChange={(event) => onDraftChange({ ...draft, hook: event.target.value })} /> : <blockquote>“{draft.hook}”</blockquote>}<small>镜头：真人先出镜，再自然带到使用场景与产品。</small></div>
        <div className="script-timeline">
          {draft.beats.map((beat, index) => <ScriptBeat key={beat.time} beat={beat} editing={editing} onChange={(field, value) => updateBeat(index, field, value)} />)}
        </div>
        <div className="compliance-check"><span>✓</span><div><strong>品牌要求检查通过</strong><small>已包含产品全名、#ad 提醒；无未经证实的功效表述。</small></div><button onClick={() => onOpenSheet("compliance")}>查看 6 项</button></div>
        <div className="script-edit-actions">
          <button className={editing ? "active" : ""} onClick={() => { setEditing(!editing); if (editing) notify("脚本修改已自动保存"); }}>{editing ? "完成修改" : "修改脚本"}</button>
          <button onClick={() => { onRegenerate(); setEditing(false); }}>重新生成脚本 ↻</button>
        </div>
        <div className="script-actions"><button className="secondary-btn" onClick={() => notify("脚本已保存到创作项目")}>保存脚本</button><button className="primary-btn" onClick={() => onGo("video")} disabled={!draft.hook.trim() || draft.beats.some((beat) => !beat.copy.trim())}>用这个脚本生成视频 →</button></div>
      </section>
    </div>
  );
}

function ScriptBeat({ beat, editing, onChange }: { beat: ScriptDraft["beats"][number]; editing: boolean; onChange: (field: "copy" | "direction", value: string) => void }) {
  return <div className={`script-beat ${editing ? "editing" : ""}`}><span className="beat-time">{beat.time}</span><span className="beat-dot" /><div><span>{beat.label}</span>{editing ? <textarea aria-label={`修改${beat.label}脚本`} value={beat.copy} onChange={(event) => onChange("copy", event.target.value)} /> : <p>{beat.copy}</p>}{editing ? <input aria-label={`修改${beat.label}镜头指导`} value={beat.direction} onChange={(event) => onChange("direction", event.target.value)} /> : <small>{beat.direction}</small>}</div></div>;
}

function VideoView({ product, angle, draft, ready, setReady, notify, onGo, onOpenSheet }: {
  product: Product;
  angle: number;
  draft: ScriptDraft;
  ready: boolean;
  setReady: (ready: boolean) => void;
  notify: (m: string) => void;
  onGo: (view: View) => void;
  onOpenSheet: (kind: SheetKind) => void;
}) {
  const [ratio, setRatio] = useState("9:16");
  const [soundtrack, setSoundtrack] = useState("温柔氛围");
  const [subtitle, setSubtitle] = useState("重点词高亮");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoVersion, setVideoVersion] = useState(1);
  const [uploadedAssets, setUploadedAssets] = useState<ScriptVideoAsset[]>([]);
  const [output, setOutput] = useState<(RenderedScriptVideo & { url: string; version: number }) | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const abortController = useRef<AbortController | null>(null);
  const assetUrls = useRef<string[]>([]);
  const outputUrl = useRef<string | null>(null);
  const versionCounter = useRef(0);
  const profile = creativeProfiles[product.id];

  useEffect(() => {
    return () => {
      abortController.current?.abort();
      assetUrls.current.forEach((url) => URL.revokeObjectURL(url));
      if (outputUrl.current) URL.revokeObjectURL(outputUrl.current);
    };
  }, []);

  useEffect(() => {
    if (ready && !outputUrl.current) setReady(false);
  }, [ready, setReady]);

  const discardOutput = () => {
    if (outputUrl.current) URL.revokeObjectURL(outputUrl.current);
    outputUrl.current = null;
    setOutput(null);
    setReady(false);
  };

  const start = async () => {
    if (generating) return;
    if (!canvasRef.current) {
      notify("视频画布尚未就绪，请稍后再试");
      return;
    }
    const nextVersion = versionCounter.current + 1;
    discardOutput();
    setProgress(0);
    setGenerating(true);
    const controller = new AbortController();
    abortController.current = controller;
    try {
      const rendered = await renderScriptVideo({
        canvas: canvasRef.current,
        product: { code: product.code, name: product.name, palette: product.palette },
        script: { hook: draft.hook, beats: draft.beats },
        ratio,
        subtitle,
        soundtrack,
        assets: uploadedAssets,
        signal: controller.signal,
        onProgress: setProgress,
      });
      const url = URL.createObjectURL(rendered.blob);
      outputUrl.current = url;
      versionCounter.current = nextVersion;
      setVideoVersion(nextVersion);
      setOutput({ ...rendered, url, version: nextVersion });
      setReady(true);
      notify(`视频 V${nextVersion} 已生成，可以预览或下载`);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        notify("已取消本次视频生成");
      } else {
        console.error("[星伴视频生成]", error);
        notify("视频生成遇到问题，请减少素材数量后重试");
      }
    } finally {
      abortController.current = null;
      setGenerating(false);
    }
  };

  const cancelGeneration = () => abortController.current?.abort();

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const accepted = Array.from(files).filter((file) => file.type.startsWith("video/") || file.type.startsWith("image/")).slice(0, 8);
    assetUrls.current.forEach((url) => URL.revokeObjectURL(url));
    const nextAssets = accepted.map((file) => ({ name: file.name, type: file.type, url: URL.createObjectURL(file) }));
    assetUrls.current = nextAssets.map((asset) => asset.url);
    setUploadedAssets(nextAssets);
    discardOutput();
    if (fileInput.current) fileInput.current.value = "";
    notify(`已加入 ${nextAssets.length} 个本地素材，生成时会按分镜自动裁切`);
  };

  const updateRatio = (value: string) => { setRatio(value); discardOutput(); };
  const updateSoundtrack = (value: string) => { setSoundtrack(value); discardOutput(); };
  const updateSubtitle = (value: string) => { setSubtitle(value); discardOutput(); };
  const downloadVideo = () => {
    if (!output) return;
    const link = document.createElement("a");
    link.href = output.url;
    link.download = `星伴-${product.code}-脚本V${draft.version}-视频V${output.version}.${output.mimeType.includes("mp4") ? "mp4" : "webm"}`;
    link.click();
    notify("视频已开始下载");
  };
  const estimatedDuration = product.id === "e12" ? 42 : product.id === "klean" ? 45 : 35;
  const sizeLabel = output ? `${(output.blob.size / 1024 / 1024).toFixed(1)} MB` : "生成后显示";
  const resolutionLabel = ratio === "9:16" ? "540×960" : ratio === "1:1" ? "720×720" : "960×540";

  return (
    <div className="video-layout" data-testid="video-view">
      <section className="video-settings">
        <div className="project-status"><div className="status-icon">✦</div><div><span>来自爆款创作 · {product.name}</span><strong>{profile.angles[angle].title}</strong><small>脚本 V{draft.version} · {estimatedDuration} 秒 · {draft.beats.length + 1} 个分镜 · 合规检查已通过</small></div><button onClick={() => onGo("studio")}>返回修改脚本</button></div>
        <div className="setting-group">
          <div className="setting-title"><span>01</span><div><strong>选择你的素材</strong><small>可不上传：星伴会先根据脚本生成完整动态样片</small></div></div>
          <input ref={fileInput} className="visually-hidden" type="file" accept="video/*,image/*" multiple onChange={(event) => addFiles(event.target.files)} />
          <div className="upload-grid"><button className="upload-box" disabled={generating} onClick={() => fileInput.current?.click()}><span>＋</span><strong>{uploadedAssets.length ? `已选择 ${uploadedAssets.length} 个素材` : "上传本次拍摄"}</strong><small>{uploadedAssets.length ? uploadedAssets.slice(0, 2).map((asset) => asset.name).join("、") : "支持视频、照片；最多 8 个"}</small></button><div className="asset-box asset-one"><span>HOOK</span><i>✓</i><small>脚本真人开场</small></div><div className="asset-box asset-two"><span>{draft.beats.length} 段</span><i>✓</i><small>脚本分镜已就绪</small></div></div>
        </div>
        <div className="setting-group"><div className="setting-title"><span>02</span><div><strong>设定成片风格</strong><small>修改设置会清除旧成片，确保预览与设置一致</small></div></div><div className="option-rows"><div className="option-row"><span>视频比例</span><div>{["9:16", "1:1", "16:9"].map((item) => <button disabled={generating} key={item} className={ratio === item ? "active" : ""} onClick={() => updateRatio(item)} aria-pressed={ratio === item}>{item}</button>)}</div></div><div className="option-row"><span>音轨</span><div>{["温柔氛围", "轻快节奏", "静音字幕版"].map((item) => <button disabled={generating} key={item} className={soundtrack === item ? "active" : ""} onClick={() => updateSoundtrack(item)} aria-pressed={soundtrack === item}>{item}</button>)}</div></div><div className="option-row"><span>字幕</span><div>{["重点词高亮", "中文极简"].map((item) => <button disabled={generating} key={item} className={subtitle === item ? "active" : ""} onClick={() => updateSubtitle(item)} aria-pressed={subtitle === item}>{item}</button>)}</div></div></div></div>
        <div className="render-explainer"><span>本地成片</span><div><strong>脚本直接驱动 {draft.beats.length + 1} 个动态分镜</strong><small>Hook、口播、镜头指导、字幕和节奏都会进入视频；无需把素材上传到第三方。</small></div></div>
        <div className="rights-box"><span>盾</span><div><strong>你的素材，你的决定</strong><small>素材只在当前浏览器内参与渲染，不会自动授权给品牌或用于模型训练。</small></div><button onClick={() => onOpenSheet("privacy")}>隐私设置</button></div>
      </section>
      <aside className="preview-panel">
        <div className="preview-head"><div><span>脚本成片预览 · 视频 V{output?.version ?? videoVersion}</span><small>脚本 V{draft.version} · {ratio} · {resolutionLabel} · {subtitle}</small></div><button onClick={() => onOpenSheet("videoMenu")} aria-label="打开视频项目菜单">···</button></div>
        <div className={`phone-preview ${ready ? "ready" : ""} ratio-${ratio.replace(":", "-")}`}>
          {output ? <video className="generated-video" src={output.url} controls playsInline preload="metadata" aria-label={`视频 V${output.version} 成片预览`} /> : !generating ? <div className="phone-scene"><span className="scene-moon">◐</span><div className="scene-person"><i /><b /></div><div className="scene-product">{product.code}</div><div className="caption-line"><span>{profile.caption[0]}</span><strong>{profile.caption[1]}</strong></div><div className="video-progress"><i /></div></div> : null}
          <canvas ref={canvasRef} className={generating ? "render-canvas visible" : "render-canvas"} aria-label="正在渲染的视频画面" />
          {generating && <div className="generate-overlay"><div className="spinner" /><strong>正在逐帧生成脚本成片</strong><span>{progress}% · 已写入字幕、镜头与音轨</span><div className="render-progress"><i style={{ width: `${progress}%` }} /></div><button onClick={cancelGeneration}>取消生成</button></div>}
        </div>
        <div className="preview-summary"><div><span>成片时长</span><b>00:{String(output?.duration ?? estimatedDuration).padStart(2, "0")}</b></div><div><span>动态分镜</span><b>{draft.beats.length + 1} 段</b></div><div><span>文件大小</span><b>{sizeLabel}</b></div></div>
        {!ready ? <button className="primary-btn full-btn" disabled={generating} onClick={start}>{generating ? `正在生成 ${progress}%` : "根据当前脚本生成视频 ✦"}</button> : <div className="ready-actions video-ready-actions"><button className="secondary-btn" onClick={start}>重新生成视频 ↻</button><button className="secondary-btn" onClick={downloadVideo}>下载视频 ↓</button><button className="primary-btn" onClick={() => onOpenSheet("publish")}>发布前检查 →</button></div>}
        <p className="generation-cost">脚本与素材均在本地浏览器生成 · 不消耗第三方视频额度</p>
      </aside>
    </div>
  );
}

const commentInsights = {
  "购买意向": { count: 126, change: "+49", summary: "粉丝不再只说“好用”，而是在主动确认购买入口和具体型号。", quote: "“求链接！这个是 S12 还是 S12 Pro？”", signal: "型号 + 购买入口是最强转化信号", action: "下一条在 18 秒明确展示型号，并把购买说明置顶。" },
  "使用疑问": { count: 84, change: "+31", summary: "声音、清洁和夜间操作是被反复追问的三个真实使用问题。", quote: "“晚上用真的不会吵醒宝宝吗？”", signal: "粉丝需要可听见、可看见的使用证据", action: "保留 2 秒环境原声，再用近景展示拆洗步骤。" },
  "情绪共鸣": { count: 213, change: "+76", summary: "“终于有人懂”类评论集中出现在真人先出镜、先讲困境的视频。", quote: "“看到凌晨三点这里，我真的眼泪下来了。”", signal: "具体时间和处境比泛化育儿情绪更有效", action: "开场继续用具体时刻，但语气放轻，不要制造焦虑。" },
  "购买阻碍": { count: 39, change: "-8", summary: "主要顾虑集中在价格是否值得，以及产品是否适合自己的使用频率。", quote: "“偶尔用一次的话，有必要买吗？”", signal: "缺少按使用频率区分的购买建议", action: "补充“适合谁 / 不适合谁”，降低不必要的购买压力。" },
};

function ReviewView({ onGo, notify, onOpenSheet }: { onGo: (v: View) => void; notify: (m: string) => void; onOpenSheet: (kind: SheetKind) => void }) {
  const [metric, setMetric] = useState("播放趋势");
  const [range, setRange] = useState("近 30 天");
  const [commentTheme, setCommentTheme] = useState<keyof typeof commentInsights>("购买意向");
  const selectedCommentInsight = commentInsights[commentTheme];
  const chartValues = metric === "播放趋势" ? [18, 32, 26, 52, 48, 70, 82, 76, 92, 86] : metric === "互动趋势" ? [24, 28, 42, 38, 58, 64, 55, 72, 68, 80] : [12, 18, 22, 20, 32, 40, 52, 48, 62, 72];
  const points = chartValues.map((v, i) => `${i * 11.1},${100 - v}`).join(" ");
  const changeRange = () => setRange((current) => current === "近 30 天" ? "近 7 天" : current === "近 7 天" ? "近 90 天" : "近 30 天");
  const exportReport = () => {
    const csv = "\ufeff指标,数值,变化\n总播放,482K,+38.2%\n平均完播,41.8%,+7.4%\n购买意向,126,+49\n预估佣金,$1284,+22.6%";
    const href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = href;
    link.download = "星伴创作者周报.csv";
    link.click();
    URL.revokeObjectURL(href);
    notify("周报已导出");
  };
  return (
    <div className="review-layout">
      <section className="review-hero">
        <div><span className="section-eyebrow">AUG 26 — SEP 01</span><h2>你的内容不只涨了播放，<br />还更接近<strong>可持续变现</strong>。</h2><p>本周发布 4 条内容，其中 2 条进入账号近 90 天 Top 10%。</p></div>
        <div className="review-badge"><span>本周成长</span><strong>↑ 18</strong><small>超过 76% 同阶段创作者</small></div>
      </section>
      <div className="metric-grid"><MetricCard label="总播放" value="482K" change="+38.2%" note="较上周" accent /><MetricCard label="平均完播" value="41.8%" change="+7.4%" note="表现健康" /><MetricCard label="购买意向" value="126" change="+49" note="条有效评论" /><MetricCard label="预估佣金" value="$1,284" change="+22.6%" note="待平台确认" /></div>
      <div className="review-middle">
        <section className="chart-card">
          <div className="chart-head"><div>{["播放趋势", "互动趋势", "转化信号"].map((item) => <button className={metric === item ? "active" : ""} onClick={() => setMetric(item)} key={item} aria-pressed={metric === item}>{item}</button>)}</div><button className="range-button" onClick={changeRange}>{range}⌄</button></div>
          <div className="chart-value"><strong>{metric === "播放趋势" ? "1.28M" : metric === "互动趋势" ? "86.4K" : "1,042"}</strong><span>↑ 24.8% 对比上周期</span></div>
          <div className="css-chart"><div className="grid-lines"><i /><i /><i /><i /></div><svg viewBox="0 0 100 105" preserveAspectRatio="none" aria-label={`${metric}折线图`}><defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fb6d4c" stopOpacity=".3"/><stop offset="100%" stopColor="#fb6d4c" stopOpacity="0"/></linearGradient></defs><polygon points={`0,105 ${points} 100,105`} fill="url(#chartFill)"/><polyline points={points} fill="none" stroke="#f46342" strokeWidth="2" vectorEffect="non-scaling-stroke" /></svg><div className="x-axis"><span>8/08</span><span>8/15</span><span>8/22</span><span>8/29</span><span>9/01</span></div></div>
        </section>
        <section className="diagnosis-card"><div className="diagnosis-head"><Mark>✦</Mark><div><span>AI 复盘结论</span><strong>这周真正有效的 3 件事</strong></div></div><ol><li><span>01</span><div><strong>真人先出镜，再露产品</strong><p>前 3 秒留存平均高出 19%，信任建立更快。</p></div></li><li><span>02</span><div><strong>“深夜”是你的强场景</strong><p>收藏率和购买意向同时提升，不只是流量波动。</p></div></li><li><span>03</span><div><strong>明确说出不便，比罗列参数有效</strong><p>带具体处境的视频，评论转化信号高 2.1 倍。</p></div></li></ol><button className="primary-btn" onClick={() => onGo("studio")}>带着结论创作下一条 →</button></section>
      </div>
      <div className="review-insight-grid">
        <section className="comment-insight-card">
          <div className="section-title-row"><div><span className="section-eyebrow">COMMENT INTELLIGENCE</span><h3>评论区洞察复盘</h3></div><span className="time-hint">已分析 1,846 条</span></div>
          <div className="comment-theme-tabs">
            {(Object.keys(commentInsights) as (keyof typeof commentInsights)[]).map((theme) => <button key={theme} className={commentTheme === theme ? "active" : ""} onClick={() => setCommentTheme(theme)} aria-pressed={commentTheme === theme}><span>{theme}</span><b>{commentInsights[theme].count}</b><small>{commentInsights[theme].change}</small></button>)}
          </div>
          <div className="comment-finding"><span>核心发现</span><h4>{selectedCommentInsight.summary}</h4><blockquote>{selectedCommentInsight.quote}</blockquote><div><b>行为信号</b><p>{selectedCommentInsight.signal}</p></div></div>
        </section>
        <section className="shooting-guide-card">
          <div className="shooting-guide-head"><Mark tone="light">✦</Mark><div><span>NEXT SHOOT GUIDE</span><h3>下次拍摄指导建议</h3></div></div>
          <p className="shooting-priority"><b>优先解决：</b>{selectedCommentInsight.action}</p>
          <ol>
            <li><span>0–3s</span><div><strong>真人先出镜</strong><small>直接说“凌晨 3 点，宝宝刚睡”。</small></div></li>
            <li><span>3–12s</span><div><strong>拍真实的不方便</strong><small>保留环境音，先让处境成立。</small></div></li>
            <li><span>12–25s</span><div><strong>给可验证证据</strong><small>近景展示型号、读数和连续动作。</small></div></li>
            <li><span>25–35s</span><div><strong>回答最高频问题</strong><small>不催单，把完整说明放在置顶评论。</small></div></li>
          </ol>
          <div className="shooting-checklist"><span>必拍：真人开场</span><span>保留：2 秒原声</span><span>避免：参数堆叠</span></div>
          <button onClick={() => onGo("studio")}>用此洞察生成下一版脚本 →</button>
        </section>
      </div>
      <section className="content-ranking"><div className="section-title-row"><div><span className="section-eyebrow">CONTENT BREAKDOWN</span><h3>内容表现拆解</h3></div><button className="text-btn" onClick={exportReport}>导出周报 ↗</button></div><div className="ranking-table"><div className="table-head"><span>内容</span><span>播放 / 完播</span><span>互动</span><span>转化信号</span><span>Agent 判断</span></div><RankRow rank="01" title="凌晨喂奶，我最怕的不是困" meta="TikTok · 8月30日" theme="night" views="186K / 52%" engagement="12.8K" signal="68" verdict="值得复用" onOpen={() => onOpenSheet("contentDetail")} /><RankRow rank="02" title="新手妈妈别急着囤这些" meta="Reels · 8月28日" theme="warm" views="142K / 46%" engagement="9.4K" signal="37" verdict="开头很强" onOpen={() => onOpenSheet("contentDetail")} /><RankRow rank="03" title="我的夜间喂养收纳台" meta="TikTok · 8月26日" theme="soft" views="94K / 38%" engagement="6.1K" signal="21" verdict="优化转场" onOpen={() => onOpenSheet("contentDetail")} /></div></section>
    </div>
  );
}

function MetricCard({ label, value, change, note, accent = false }: { label: string; value: string; change: string; note: string; accent?: boolean }) {
  return <div className={`metric-card ${accent ? "accent" : ""}`}><span>{label}</span><strong>{value}</strong><div><b>{change}</b><small>{note}</small></div></div>;
}

function RankRow({ rank, title, meta, theme, views, engagement, signal, verdict, onOpen }: { rank: string; title: string; meta: string; theme: string; views: string; engagement: string; signal: string; verdict: string; onOpen: () => void }) {
  return <button className="table-row" onClick={onOpen} aria-label={`查看内容复盘：${title}`}><span className="rank">{rank}</span><span className={`video-thumb ${theme}`}><i>▶</i></span><span className="content-name"><strong>{title}</strong><small>{meta}</small></span><span>{views}</span><span>{engagement}</span><span><b>{signal}</b> 条</span><span className="verdict-pill">{verdict}</span></button>;
}

function SettlementView({ notify }: { notify: (message: string) => void }) {
  const [filter, setFilter] = useState<"全部" | CommissionStatus>("全部");
  const [period, setPeriod] = useState("2026年9月");
  const [selectedRecord, setSelectedRecord] = useState<CommissionRecord | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<"paypal" | "bank">("paypal");
  const [withdrawConfirmed, setWithdrawConfirmed] = useState(false);
  const [payoutRequested, setPayoutRequested] = useState(false);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedRecord(null);
        setWithdrawOpen(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const statusFor = (record: CommissionRecord): CommissionStatus => payoutRequested && record.status === "可提现" ? "处理中" : record.status;
  const periodRecords = commissionRecords.filter((record) => record.period === period);
  const visibleRecords = periodRecords.filter((record) => filter === "全部" || statusFor(record) === filter);
  const availableAmount = payoutRequested ? 0 : commissionSummary.available;
  const processingAmount = commissionSummary.processing + (payoutRequested ? commissionSummary.available : 0);
  const periods = ["2026年9月", "2026年8月", "2026年7月"];
  const changePeriod = () => {
    setPeriod((current) => periods[(periods.indexOf(current) + 1) % periods.length]);
    setFilter("全部");
  };
  const exportStatement = () => {
    const rows = periodRecords.map((record) => [record.settlementNo, record.title, record.channel, record.orderWindow, record.attributedSales, `${record.commissionRate}%`, record.refundAdjustment, record.bonusAdjustment, record.commission, statusFor(record)].join(","));
    const csv = `\ufeff结算单号,合作内容,归因渠道,订单周期,归因成交,佣金率,退款调整,奖励调整,应结佣金,状态\n${rows.join("\n")}`;
    const href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = href;
    link.download = `星伴佣金结算-${period}.csv`;
    link.click();
    URL.revokeObjectURL(href);
    notify("佣金结算单已导出");
  };
  const confirmWithdrawal = () => {
    if (!withdrawConfirmed) return;
    setPayoutRequested(true);
    setWithdrawOpen(false);
    setFilter("全部");
    notify(`已提交 ${formatUsd(commissionSummary.available)} 提现申请，预计 1–3 个工作日到账`);
  };
  const selectedProductForSettlement = selectedRecord ? products.find((item) => item.id === selectedRecord.productId) ?? products[0] : products[0];
  const selectedStatus = selectedRecord ? statusFor(selectedRecord) : undefined;
  const detailStage = selectedStatus === "待确认" ? 2 : selectedStatus === "可提现" ? 3 : selectedStatus === "处理中" ? 4 : 5;

  return <>
    <div className="settlement-layout" data-testid="settlement-view">
      <section className="settlement-hero">
        <div className="settlement-hero-copy"><span>CREATOR PAYOUTS · MOMCOZY</span><h2>收入不只要看得见，<br />还要<strong>清清楚楚到账</strong>。</h2><p>订单归因、退货调整、品牌确认与到账进度都集中在这里；预估金额不会提前计入可提现余额。</p></div>
        <div className="available-balance"><span>可提现余额 · USD</span><strong>{formatUsd(availableAmount)}</strong><small>{payoutRequested ? `${formatUsd(commissionSummary.available)} 正在处理 · 预计 1–3 个工作日` : "来自 2 笔已确认佣金 · 本次提现免手续费"}</small><button onClick={() => payoutRequested ? notify("提现申请正在处理，预计 1–3 个工作日到账") : setWithdrawOpen(true)}>{payoutRequested ? "提现处理中 ···" : "申请提现 →"}</button></div>
      </section>

      <div className="settlement-metrics">
        <div><span>本月预估佣金</span><strong>{formatUsd(commissionSummary.estimated)}</strong><small>按当前有效归因订单计算</small></div>
        <div><span>待品牌确认</span><strong>{formatUsd(commissionSummary.pending)}</strong><small>退货期结束后进入核对</small></div>
        <div className="accent"><span>处理中</span><strong>{formatUsd(processingAmount)}</strong><small>{payoutRequested ? "包含本次提现申请" : "1 笔预计 9月11日到账"}</small></div>
        <div><span>累计已结算</span><strong>{formatUsd(commissionSummary.paidLifetime)}</strong><small>合作以来佣金收入</small></div>
      </div>

      <div className="settlement-columns">
        <section className="commission-ledger">
          <div className="settlement-section-head"><div><span>COMMISSION LEDGER</span><h3>佣金明细</h3></div><div><button onClick={changePeriod}>{period}⌄</button><button onClick={exportStatement}>导出结算单 ↗</button></div></div>
          <div className="settlement-filters" aria-label="按结算状态筛选">
            {(["全部", "待确认", "可提现", "处理中", "已结算"] as const).map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)} aria-pressed={filter === item}>{item}<span>{item === "全部" ? periodRecords.length : periodRecords.filter((record) => statusFor(record) === item).length}</span></button>)}
          </div>
          <div className="commission-table" role="table" aria-label="佣金结算记录">
            <div className="commission-table-head" role="row"><span>合作 / 归因周期</span><span>归因成交</span><span>佣金率</span><span>应结佣金</span><span>状态</span></div>
            {visibleRecords.map((record) => {
              const product = products.find((item) => item.id === record.productId) ?? products[0];
              const status = statusFor(record);
              return <button role="row" className="commission-row" key={record.id} onClick={() => setSelectedRecord(record)} aria-label={`查看佣金明细：${record.title}`}>
                <span className="commission-campaign"><i>{product.code}</i><span><strong>{record.title}</strong><small>{record.channel} · {record.orderWindow}</small></span></span>
                <span>{formatUsd(record.attributedSales)}</span><span>{record.commissionRate}%</span><span className="commission-amount">{formatUsd(record.commission)}</span><span><em className={`commission-status status-${status}`}>{status}</em><small>{payoutRequested && record.status === "可提现" ? "预计 1–3 个工作日到账" : record.expectedAt}</small></span>
              </button>;
            })}
            {!visibleRecords.length && <div className="settlement-empty">当前筛选下没有结算记录</div>}
          </div>
        </section>

        <aside className="settlement-side">
          <section className="settlement-process-card"><span className="section-eyebrow">SETTLEMENT FLOW</span><h3>一笔佣金如何到账</h3><ol><li className="done"><i>✓</i><div><strong>订单归因</strong><small>按专属链接或优惠码锁定有效成交</small></div></li><li className="done"><i>✓</i><div><strong>退货观察期</strong><small>退款与取消订单会自动扣除</small></div></li><li className="active"><i>3</i><div><strong>品牌核对</strong><small>Momcozy 确认订单与佣金比例</small></div></li><li><i>4</i><div><strong>可提现</strong><small>确认后进入你的可提现余额</small></div></li><li><i>5</i><div><strong>到账</strong><small>提交后 1–3 个工作日到收款账户</small></div></li></ol><p>星伴会提醒异常差额，但不会替你确认或放弃申诉。</p></section>
          <section className="payout-account-card"><div><span>默认收款账户</span><em>已验证</em></div><strong>PayPal · mi***@gmail.com</strong><small>币种 USD · 无平台提现手续费</small><button onClick={() => notify("收款账户管理已打开；修改前需要再次验证身份")}>管理收款账户 →</button></section>
          <section className="settlement-alert"><span>!</span><div><strong>有 1 笔佣金仍在确认</strong><p>S12 Pro 新品首发包含 {formatUsd(-commissionRecords[2].refundAdjustment)} 退款调整，预计 9月16日完成核对。</p><button onClick={() => setSelectedRecord(commissionRecords[2])}>查看差额依据 →</button></div></section>
        </aside>
      </div>
    </div>

    {selectedRecord && <div className="settlement-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedRecord(null); }}>
      <div className="settlement-modal" role="dialog" aria-modal="true" aria-labelledby="commission-detail-title">
        <button className="settlement-modal-close" onClick={() => setSelectedRecord(null)} aria-label="关闭佣金明细">×</button>
        <span className="settlement-modal-kicker">{selectedRecord.settlementNo}</span><h2 id="commission-detail-title">{selectedRecord.title}</h2><p>{selectedRecord.campaign} · {selectedRecord.channel}</p>
        <div className="settlement-detail-total"><span className="collaboration-product-code">{selectedProductForSettlement.code}</span><div><small>最终应结佣金</small><strong>{formatUsd(selectedRecord.commission)}</strong><em className={`commission-status status-${statusFor(selectedRecord)}`}>{statusFor(selectedRecord)}</em></div></div>
        <div className="commission-breakdown"><div><span>有效归因成交</span><strong>{formatUsd(selectedRecord.attributedSales)}</strong></div><div><span>基础佣金 · {selectedRecord.commissionRate}%</span><strong>{formatUsd(Math.round(selectedRecord.attributedSales * selectedRecord.commissionRate / 100))}</strong></div><div><span>退款 / 取消调整</span><strong className={selectedRecord.refundAdjustment < 0 ? "negative" : ""}>{selectedRecord.refundAdjustment < 0 ? `-${formatUsd(Math.abs(selectedRecord.refundAdjustment))}` : selectedRecord.refundAdjustment > 0 ? `+${formatUsd(selectedRecord.refundAdjustment)}` : "$0"}</strong></div><div><span>活动奖励调整</span><strong>{selectedRecord.bonusAdjustment ? `+${formatUsd(selectedRecord.bonusAdjustment)}` : "$0"}</strong></div><div className="total"><span>本期应结</span><strong>{formatUsd(selectedRecord.commission)}</strong></div></div>
        <div className="settlement-detail-progress">{["订单锁定", "退货期", "品牌核对", "可提现", "到账"].map((step, index) => <span key={step} className={index < detailStage ? "done" : index === detailStage ? "active" : ""}><i>{index < detailStage ? "✓" : index + 1}</i><small>{step}</small></span>)}</div>
        <div className="settlement-detail-actions"><button onClick={() => notify(`${selectedRecord.settlementNo} 的结算单已准备下载`)}>下载该笔结算单</button><button onClick={() => notify("已创建金额复核申请，品牌财务会在 2 个工作日内回复")}>对金额有疑问？发起复核</button></div>
      </div>
    </div>}

    {withdrawOpen && <div className="settlement-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setWithdrawOpen(false); }}>
      <div className="settlement-modal withdrawal-modal" role="dialog" aria-modal="true" aria-labelledby="withdraw-title">
        <button className="settlement-modal-close" onClick={() => setWithdrawOpen(false)} aria-label="关闭提现申请">×</button><span className="settlement-modal-kicker">PAYOUT REQUEST</span><h2 id="withdraw-title">申请提现</h2><p>只有已经完成品牌确认的佣金会进入本次提现。</p>
        <div className="withdraw-amount"><span>本次提现金额</span><strong>{formatUsd(commissionSummary.available)}</strong><small>手续费 $0 · 到账币种 USD</small></div>
        <div className="payout-methods" role="radiogroup" aria-label="选择收款方式"><button role="radio" aria-checked={payoutMethod === "paypal"} className={payoutMethod === "paypal" ? "active" : ""} onClick={() => setPayoutMethod("paypal")}><span>P</span><div><strong>PayPal</strong><small>mi***@gmail.com · 预计 1–3 个工作日</small></div><i>{payoutMethod === "paypal" ? "✓" : ""}</i></button><button role="radio" aria-checked={payoutMethod === "bank"} className={payoutMethod === "bank" ? "active" : ""} onClick={() => setPayoutMethod("bank")}><span>▤</span><div><strong>银行账户</strong><small>•••• 4826 · 预计 3–5 个工作日</small></div><i>{payoutMethod === "bank" ? "✓" : ""}</i></button></div>
        <button className="withdraw-confirmation" role="switch" aria-checked={withdrawConfirmed} onClick={() => setWithdrawConfirmed((value) => !value)}><i>{withdrawConfirmed ? "✓" : ""}</i><span><strong>我已核对结算金额与收款账户</strong><small>提交后，本次申请进入处理阶段，无法自行撤回。</small></span></button>
        <button className="primary-btn full-btn" disabled={!withdrawConfirmed} onClick={confirmWithdrawal}>确认提现 {formatUsd(commissionSummary.available)} →</button>
      </div>
    </div>}
  </>;
}

function ProfileView({ profile, notify, onOpenSheet, milestoneAdded, setMilestoneAdded }: { profile: { name: string; bio: string }; notify: (m: string) => void; onOpenSheet: (kind: SheetKind) => void; milestoneAdded: boolean; setMilestoneAdded: (added: boolean) => void }) {
  return (
    <div className="profile-layout">
      <section className="profile-card-main"><div className="profile-hero"><span className="avatar avatar-large">{profile.name.slice(0, 1).toUpperCase()}</span><div><span className="verified-line">已验证创作者 · TikTok / Instagram</span><h2>{profile.name}</h2><p>{profile.bio}</p><div className="profile-tags"><i>母婴生活</i><i>真实体验</i><i>北美华人</i><i>生活流短视频</i></div></div><button className="secondary-btn" onClick={() => onOpenSheet("profile")}>编辑资料</button></div><div className="asset-metrics"><div><span>全平台粉丝</span><strong>286K</strong><small>近 30 天 +8.4%</small></div><div><span>商业内容均播</span><strong>118K</strong><small>基于 16 条合作</small></div><div><span>准时交付率</span><strong>96%</strong><small>连续 8 次按时</small></div><div><span>品牌复投率</span><strong>62%</strong><small>高于同阶段均值</small></div></div></section>
      <div className="profile-columns"><section className="capability-card"><div className="section-title-row"><div><span className="section-eyebrow">CAPABILITY MAP</span><h3>创作者能力图谱</h3></div><span className="level-pill">成长期 · L3</span></div><div className="bar-list"><Capability label="场景叙事" value={88} /><Capability label="受众信任" value={84} /><Capability label="商业转化" value={76} /><Capability label="镜头表现" value={72} /><Capability label="稳定交付" value={91} /></div></section><section className="brand-history"><div className="section-title-row"><div><span className="section-eyebrow">BRAND RELATIONSHIP</span><h3>品牌合作资产</h3></div><span>12 次合作</span></div><button className="history-brand featured" onClick={() => onOpenSheet("relationship")}><span>M</span><div><strong>Momcozy</strong><small>合作 {momcozyRelationship.collaborationMonths} 个月 · 亲密度 {momcozyRelationship.score}</small></div><em>{momcozyRelationship.level}</em></button><div className="history-brand"><span>H</span><div><strong>Hatch</strong><small>合作 2 次 · 复投 1 次</small></div><em>稳定合作</em></div><div className="history-brand"><span>B</span><div><strong>Babylist</strong><small>合作 1 次 · 已完成</small></div><em>关系良好</em></div></section></div>
      <section className="next-level-card"><div><Mark>✦</Mark><span className="section-eyebrow">NEXT MILESTONE</span><h3>距离「品牌共创者」还差一步</h3><p>完成一次从选品到复盘的完整合作闭环，并保持内容完播率 ≥ 40%。</p></div><div className="milestone-progress"><span><i style={{ width: "76%" }} /></span><div><b>76%</b><button className={milestoneAdded ? "added" : ""} onClick={() => { setMilestoneAdded(!milestoneAdded); notify(milestoneAdded ? "已从本周成长清单移除" : "已加入本周成长清单"); }}>{milestoneAdded ? "已加入本周目标 ✓" : "加入本周目标 →"}</button></div></div></section>
    </div>
  );
}

function Capability({ label, value }: { label: string; value: number }) {
  return <div><span>{label}</span><i><b style={{ width: `${value}%` }} /></i><strong>{value}</strong></div>;
}

function AgentPanel({ messages, chatInput, setChatInput, sendMessage, close, onGo, view, applicationState, product, status }: {
  messages: ChatMessage[]; chatInput: string; setChatInput: (v: string) => void; sendMessage: (p?: string) => void | Promise<void>; close: () => void; onGo: (v: View) => void; view: View; applicationState: ApplicationState; product: Product; status: AgentStatus;
}) {
  const messagesEnd = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages]);
  const isThinking = status === "thinking";
  const statusText = status === "thinking" ? "正在思考" : status === "checking" ? "正在连接" : status === "unconfigured" ? "等待模型配置" : status === "error" ? "连接异常" : "AI 经纪人在线";
  const nextAction = view === "settlement"
    ? { title: "先核对金额，再发起提现", copy: "预估佣金会经过退货期与品牌核对，只有“可提现”的金额才会进入收款账户。", label: "回到结算总览", target: "settlement" as View }
    : view === "pet"
    ? { title: "可靠合作，才是亲密度的成长来源", copy: "完成当前合作并按时上线，预计可以解锁下一份小屋装饰。", label: "查看合作进度", target: "opportunities" as View }
    : view === "studio"
      ? { title: "脚本确认后，生成第一版视频", copy: "素材和表达仍由你控制，AI 只负责剪辑与适配。", label: "去生成视频", target: "video" as View }
    : view === "video"
      ? { title: "保存成片，再回到数据闭环", copy: "发布前会先检查授权、字幕与品牌要求。", label: "查看复盘方法", target: "review" as View }
      : applicationState === "submitted"
        ? { title: "申请已提交，先把创作准备好", copy: "品牌确认后可以直接进入脚本与交付。", label: "继续创作", target: "studio" as View }
        : { title: "先确认合作，再开始创作", copy: "这样生成的脚本会自动带上品牌要求，减少返工。", label: "去确认合作", target: "opportunities" as View };
  return (
    <aside className="agent-panel">
      <div className="agent-head"><div><span className={`agent-orb ${isThinking ? "thinking" : ""}`}>✦</span><span><strong>星伴</strong><small className={`status-${status}`}><i /> {statusText}</small></span></div><button onClick={close} aria-label="关闭 AI 经纪人">×</button></div>
      <div className="agent-body">
        <div className="agent-context"><span>当前页面</span><div><b>{viewTitles[view].title} · {product.code}</b><small>模型会结合当前商品、申请状态和最近对话</small></div></div>
        <div className="message-list" aria-live="polite">{messages.map((message, i) => <div className={`message ${message.role} ${message.error ? "error" : ""}`} key={`${message.role}-${i}`}>{message.role === "agent" && <span>✦</span>}<p>{message.streaming && !message.text ? <span className="typing-dots"><i /><i /><i /></span> : message.text}</p></div>)}<div ref={messagesEnd} /></div>
        <div className="quick-prompts"><button disabled={isThinking} onClick={() => sendMessage(`为什么 ${product.name} 适合我？`)}>为什么这个机会适合我？</button><button disabled={isThinking} onClick={() => sendMessage(`帮我优化 ${product.name} 的视频脚本`)}>帮我优化今天的视频脚本</button></div>
        <div className="agent-action-card"><span>建议下一步</span><strong>{nextAction.title}</strong><p>{nextAction.copy}</p><button onClick={() => onGo(nextAction.target)}>{nextAction.label} <span>→</span></button></div>
      </div>
      <div className="agent-input"><div><textarea aria-label="给 AI 经纪人发消息" rows={1} maxLength={2000} disabled={isThinking} placeholder={isThinking ? "星伴正在回复…" : "问选品、合作或创作…"} value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} /><button disabled={isThinking || !chatInput.trim()} onClick={() => sendMessage()} aria-label={isThinking ? "正在生成回复" : "发送消息"}>{isThinking ? "···" : "↑"}</button></div><small>{status === "unconfigured" ? "模型尚未配置，添加密钥后即可开始对话。" : "重要合作信息与对外动作仍由你最终确认。"}</small></div>
    </aside>
  );
}

function ApplyModal({ product, state, onClose, onDraft, onSubmit, onEvidence }: { product: Product; state: ApplicationState; onClose: () => void; onDraft: () => void; onSubmit: () => void; onEvidence: () => void }) {
  const [statement, setStatement] = useState(state === "draft" ? applicationDraft(product) : "");
  const [generated, setGenerated] = useState(state === "draft");
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  const generate = () => { setStatement(applicationDraft(product)); setGenerated(true); onDraft(); };
  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="apply-modal" role="dialog" aria-modal="true" aria-labelledby="apply-title">
        <button className="modal-close" onClick={onClose} aria-label="关闭申请">×</button>
        <div className="modal-kicker"><Mark>✦</Mark><span>AI 申请助理</span></div>
        <h2 id="apply-title">申请 {product.name}</h2>
        <p className="modal-subtitle">我会用你可验证的资料起草申请，不会编造数据或自动发送。</p>
        <div className="application-summary"><span><b>合作报酬</b>{product.fee} + {product.commission}</span><span><b>内容交付</b>{product.tags[0]} · {product.tags[1]}</span></div>
        <label className="statement-field"><span><b>申请说明</b><em>{statement.length}/500</em></span><textarea value={statement} onChange={(e) => setStatement(e.target.value)} placeholder="点击下方按钮，让 AI 根据你的资料起草…" /></label>
        <div className="evidence-note"><span>✓</span><p><strong>使用了 3 项可验证信息</strong><small>创作者定位、近 30 天内容表现、已验证代表作</small></p><button onClick={onEvidence}>查看依据</button></div>
        {!generated ? <button className="generate-draft-btn" onClick={generate}><Mark tone="light">✦</Mark> 生成我的申请草稿</button> : <div className="modal-actions"><button className="secondary-btn" onClick={generate}>重新生成</button><button className="primary-btn" disabled={!statement.trim()} onClick={onSubmit}>确认并提交申请 →</button></div>}
        <p className="human-note">提交后 Momcozy 才会收到。报价、合同与发布仍由你本人确认。</p>
        <button className="modal-back-link" onClick={onClose}>暂不申请，返回合作机会</button>
      </div>
    </div>
  );
}

function ActionSheet({ kind, product, profile, onProfileSave, onClose, onGo, notify, readInvitationIds, onOpenInvitation, selectedCollaborationId, onSelectCollaboration }: { kind: Exclude<SheetKind, null>; product: Product; profile: { name: string; bio: string }; onProfileSave: (profile: { name: string; bio: string }) => void; onClose: () => void; onGo: (view: View, product?: Product) => void; notify: (message: string) => void; readInvitationIds: string[]; onOpenInvitation: (invitation: BrandInvitation) => void; selectedCollaborationId: string; onSelectCollaboration: (collaborationId: string) => void }) {
  const [profileName, setProfileName] = useState(profile.name);
  const [profileBio, setProfileBio] = useState(profile.bio);
  const [privacy, setPrivacy] = useState({ train: false, brand: false, current: true });
  const selectedCollaboration = collaborationRecords.find((record) => record.id === selectedCollaborationId) ?? collaborationRecords[0];
  const selectedCollaborationProduct = products.find((item) => item.id === selectedCollaboration.productId) ?? products[0];
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const titles: Record<Exclude<SheetKind, null>, [string, string]> = {
    notifications: ["通知中心", "3 条需要你关注的消息"],
    invitations: ["Momcozy 主动邀请", `${brandInvitations.filter((invitation) => !readInvitationIds.includes(invitation.id)).length} 条未读 · ${brandInvitations.length} 条进行中`],
    relationship: ["Momcozy 亲密度", `合作始于 ${momcozyRelationship.startedAt}`],
    collaboration: ["合作进度", `${collaborationRecords.length} 个 Momcozy 合作项目`],
    brief: ["完整合作 Brief", product.name],
    compliance: ["发布合规检查", "6 项要求全部通过"],
    privacy: ["素材与隐私", "你始终拥有最终控制权"],
    videoMenu: ["视频项目", creativeProfiles[product.id].angles[0].title],
    evidence: ["申请依据", "仅使用你已确认的信息"],
    profile: ["编辑创作者资料", "品牌会看到你保存后的公开资料"],
    publish: ["发布前最后检查", "确认后再进入真实发布流程"],
    contentDetail: ["单条内容复盘", "凌晨喂奶，我最怕的不是困"],
    application: ["申请进度", product.name],
  };
  const [title, subtitle] = titles[kind];
  const go = (view: View, nextProduct?: Product) => { onClose(); onGo(view, nextProduct); };

  return (
    <div className="sheet-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside className="action-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" data-testid="action-sheet">
        <div className="sheet-header"><div><span>{subtitle}</span><h2 id="sheet-title">{title}</h2></div><button onClick={onClose} aria-label="关闭面板">×</button></div>
        <div className="sheet-body">
          {kind === "notifications" && <div className="notification-list">
            <button onClick={() => go("opportunities")}><span className="notice-icon coral">!</span><div><strong>Momcozy 邀请你申请新品合作</strong><small>申请窗口还剩 4 天 · 10 分钟前</small></div><b>→</b></button>
            <button onClick={() => go("studio")}><span className="notice-icon lime">✓</span><div><strong>KleanPal 脚本已通过基础检查</strong><small>还有 1 项品牌备注待查看 · 1 小时前</small></div><b>→</b></button>
            <button onClick={() => go("review")}><span className="notice-icon mint">↗</span><div><strong>你的本周内容复盘已生成</strong><small>发现 3 个可复用的增长信号 · 昨天</small></div><b>→</b></button>
          </div>}

          {kind === "invitations" && <div className="invitation-panel">
            <div className="invitation-summary"><span><strong>{brandInvitations.length}</strong><small>进行中的主动邀请</small></span><p>这些机会由 Momcozy 主动发起。打开邀请只会标记为已读，不会自动接受合作。</p></div>
            <div className="invitation-list">
              {brandInvitations.map((invitation) => {
                const unread = !readInvitationIds.includes(invitation.id);
                return <button className={unread ? "unread" : ""} key={invitation.id} onClick={() => onOpenInvitation(invitation)}>
                  <span className="invite-brand-mark">M</span>
                  <span className="invite-message"><i>{invitation.campaign}{unread ? " · NEW" : ""}</i><strong>{invitation.title}</strong><small>{invitation.reward}</small><em>{invitation.receivedAt} · {invitation.deadline}</em></span>
                  <b>{invitation.fit}<i>→</i></b>
                </button>;
              })}
            </div>
          </div>}

          {kind === "relationship" && <div className="relationship-detail">
            <div className="relationship-score-hero"><span className="relationship-monogram">M</span><div><small>MOMCOZY RELATIONSHIP</small><strong>{momcozyRelationship.score}<i>/100</i></strong><em>{momcozyRelationship.level}</em></div></div>
            <p className="relationship-explainer">亲密度以合作时长为基础，再叠加真实合作、品牌复投和准时交付。分数用于解释关系进展，不代表品牌承诺或合作资格。</p>
            <div className="relationship-factors">
              <div><span>合作时长</span><strong>{momcozyRelationship.collaborationMonths} 个月</strong><em>+{momcozyRelationship.timeScore}</em></div>
              <div><span>完成合作</span><strong>{momcozyRelationship.completedCollaborations} 次</strong><em>+{momcozyRelationship.collaborationBonus}</em></div>
              <div><span>品牌复投</span><strong>{momcozyRelationship.repeatCollaborations} 次</strong><em>+{momcozyRelationship.repeatBonus}</em></div>
              <div><span>准时交付</span><strong>{momcozyRelationship.onTimeRate}%</strong><em>+{momcozyRelationship.trustBonus}</em></div>
            </div>
            <div className="relationship-next"><span><i style={{ width: `${momcozyRelationship.score}%` }} /></span><div><b>再提升 {momcozyRelationship.nextLevelScore - momcozyRelationship.score} 分，进入「品牌共创者」</b><small>完成当前邀请并保持准时交付，是最直接的提升路径。</small></div></div>
            <button className="primary-btn full-btn" onClick={() => go("pet")}>进入亲密养成小屋 →</button>
            <button className="sheet-secondary" onClick={() => { onClose(); onGo("opportunities"); }}>查看 Momcozy 合作机会</button>
          </div>}

          {kind === "collaboration" && <div className="collaboration-detail">
            <div className="collaboration-switcher" aria-label="选择合作项目">
              {collaborationRecords.map((record) => <button key={record.id} className={record.id === selectedCollaboration.id ? "active" : ""} onClick={() => onSelectCollaboration(record.id)} aria-pressed={record.id === selectedCollaboration.id}><span>{record.title}</span><small>{collaborationStages[record.stageIndex]} · {record.updatedAt}</small></button>)}
            </div>
            <div className="collaboration-summary">
              <span className="collaboration-product-code">{selectedCollaborationProduct.code}</span>
              <div><small>MOMCOZY · {selectedCollaboration.campaign}</small><h3>{selectedCollaboration.title}</h3><p>{selectedCollaboration.status}</p></div>
            </div>
            <div className="collaboration-progress-track"><i style={{ width: `${((selectedCollaboration.stageIndex + 1) / collaborationStages.length) * 100}%` }} /></div>
            <div className="collaboration-stage-list">
              {collaborationStages.map((stage, index) => {
                const done = index < selectedCollaboration.stageIndex || selectedCollaboration.stageIndex === collaborationStages.length - 1;
                const active = index === selectedCollaboration.stageIndex && !done;
                const descriptions = ["品牌与红人已建立联系", "合作方向、报价与档期已确认", "样品寄送与收货状态", "视频发布并开始累计表现", "验收、结算并沉淀合作资产"];
                return <div key={stage} className={`collaboration-stage ${done ? "done" : ""} ${active ? "active" : ""}`}><i>{done ? "✓" : index + 1}</i><div><strong>{stage}</strong><small>{descriptions[index]}</small></div>{active && <em>当前</em>}</div>;
              })}
            </div>
            <div className="collaboration-next-action"><span>建议下一步</span><strong>{selectedCollaboration.nextAction}</strong><small>星伴会带着当前合作信息进入下一步，不需要重复选择产品。</small></div>
            <button className="primary-btn full-btn" onClick={() => go(selectedCollaboration.targetView, selectedCollaborationProduct)}>{selectedCollaboration.nextAction} →</button>
          </div>}

          {kind === "brief" && <div className="sheet-section-list">
            <SheetSection number="01" title="合作目标" text={`用真实育儿场景介绍 ${product.name}，帮助新手妈妈理解产品在日常中的实际价值。`} />
            <SheetSection number="02" title="必须包含" text={`产品完整名称、#ad 标识、本人真实使用画面，以及 ${product.tags[1]} 的完整体验。`} />
            <SheetSection number="03" title="不可出现" text="未经证实的健康功效、竞品对比贬低、宝宝正脸敏感画面，以及品牌未确认的价格信息。" />
            <SheetSection number="04" title="交付与授权" text={`${product.tags[0]}；截止 ${product.deadline}。品牌可进行 30 天广告投放，不含竞品排他。`} />
          </div>}

          {kind === "compliance" && <div className="check-list">
            {["产品完整名称已出现", "#ad 广告标识已加入", "真人使用场景完整", "没有未经证实的功效描述", "没有露出竞品或敏感信息", "授权时长与 Brief 一致"].map((item) => <div key={item}><span>✓</span><p>{item}</p></div>)}
          </div>}

          {kind === "privacy" && <div className="privacy-list">
            <ToggleRow label="仅用于当前视频项目" note="素材不会自动用于其他项目" checked={privacy.current} onChange={() => setPrivacy((value) => ({ ...value, current: !value.current }))} />
            <ToggleRow label="允许品牌查看原始素材" note="默认关闭，需要你主动授权" checked={privacy.brand} onChange={() => setPrivacy((value) => ({ ...value, brand: !value.brand }))} />
            <ToggleRow label="允许用于改进 AI 模型" note="默认关闭，不影响视频生成" checked={privacy.train} onChange={() => setPrivacy((value) => ({ ...value, train: !value.train }))} />
            <p className="privacy-note">删除项目时，你可以同时删除已上传的原始素材和 AI 成片。</p>
          </div>}

          {kind === "videoMenu" && <div className="sheet-menu">
            <button onClick={() => { notify("已复制为一个新版本"); onClose(); }}><span>＋</span><div><strong>复制为新版本</strong><small>保留当前设置，继续尝试另一种节奏</small></div><b>→</b></button>
            <button onClick={() => { notify("项目名称已更新"); onClose(); }}><span>✎</span><div><strong>重命名项目</strong><small>便于在多个合作中快速查找</small></div><b>→</b></button>
            <button onClick={() => { notify("项目已归档，可随时恢复"); onClose(); }}><span>□</span><div><strong>归档项目</strong><small>不会删除素材或成片</small></div><b>→</b></button>
          </div>}

          {kind === "evidence" && <div className="evidence-list">
            <div><span>已验证</span><strong>创作者定位</strong><p>母婴生活 · 真实体验 · 北美华人</p></div>
            <div><span>平台数据</span><strong>近 30 天内容信号</strong><p>夜间育儿主题收藏率与购买意向评论突出</p></div>
            <div><span>本人确认</span><strong>代表内容</strong><p>3 条已验证作品，未使用品牌内部评分或其他红人数据</p></div>
          </div>}

          {kind === "profile" && <div className="profile-form">
            <label><span>公开名称</span><input value={profileName} onChange={(event) => setProfileName(event.target.value)} /></label>
            <label><span>一句话介绍</span><textarea value={profileBio} onChange={(event) => setProfileBio(event.target.value)} /></label>
            <label><span>核心内容方向</span><input value="母婴生活、真实体验、生活流短视频" readOnly /></label>
            <div className="form-note">已验证的平台数据不会因编辑公开资料而改变。</div>
            <button className="primary-btn full-btn" disabled={!profileName.trim() || !profileBio.trim()} onClick={() => { onProfileSave({ name: profileName.trim(), bio: profileBio.trim() }); notify("创作者资料已保存"); onClose(); }}>保存资料</button>
          </div>}

          {kind === "publish" && <div className="publish-check">
            <div className="publish-score"><strong>6/6</strong><span>发布要求已满足</span></div>
            <div className="check-list compact">{["品牌要求与脚本一致", "字幕与画面安全区正常", "音乐和素材授权已确认", "最终成片仍由你本人发布"].map((item) => <div key={item}><span>✓</span><p>{item}</p></div>)}</div>
            <button className="primary-btn full-btn" onClick={() => { notify("成片已保存，发布后数据会自动进入复盘"); go("review"); }}>保存成片并查看复盘路径 →</button>
            <button className="sheet-secondary" onClick={() => go("video")}>返回修改视频</button>
          </div>}

          {kind === "contentDetail" && <div className="content-detail">
            <div className="detail-score"><span>综合表现</span><strong>92</strong><small>近 90 天 Top 10%</small></div>
            <SheetSection number="01" title="开头为什么有效" text="真人在第 0.7 秒出现，并直接说出深夜喂奶的具体困扰；前 3 秒留存达到 81%。" />
            <SheetSection number="02" title="转化发生在哪里" text="第 18 秒展示真实使用刻度后，求链接和产品型号提问明显增加。" />
            <SheetSection number="03" title="下次怎么复用" text="保留真人先出镜与具体处境，把产品露出提前约 2 秒，减少中段停顿。" />
            <button className="primary-btn full-btn" onClick={() => go("studio")}>复用这个结构创作 →</button>
          </div>}

          {kind === "application" && <div className="application-timeline">
            <div className="application-status"><span>申请已提交</span><strong>Momcozy 正在审核</strong><small>预计 2–3 个工作日内回复</small></div>
            {collaborationStages.map((stage, index) => <div key={stage} className={`application-step ${index === 0 ? "done" : index === 1 ? "active" : ""}`}><i>{index === 0 ? "✓" : index + 1}</i><div><strong>{stage}</strong><small>{index === 0 ? "今天 09:42 · 已与品牌建立联系" : index === 1 ? "正在确认报价、档期与内容方向" : index === 2 ? "合作确认后同步物流状态" : index === 3 ? "发布后自动接入内容数据" : "验收结算并沉淀合作资产"}</small></div></div>)}
            <button className="secondary-btn full-btn" onClick={() => go("studio")}>等待期间先准备内容 →</button>
          </div>}
        </div>
      </aside>
    </div>
  );
}

function PetView({ intimacyScore, notify, onViewRelationship }: { intimacyScore: number; notify: (message: string) => void; onViewRelationship: () => void }) {
  return <div className="pet-page" data-testid="pet-view">
    <div className="pet-page-intro"><div><span>YOUR BOND, YOUR COMPANION</span><h2>和糯米一起，把可靠的合作养成长期默契。</h2><p>宠物奖励只来自真实合作亲密度；喂养负责陪伴感，不会反向影响品牌评分。</p></div><div className="pet-page-unlocks"><span><b>3</b><small>已解锁里程碑</small></span><span><b>2</b><small>距下一奖励</small></span><span><b>+4</b><small>当前任务奖励</small></span></div></div>
    <PetGame intimacyScore={intimacyScore} notify={notify} onViewRelationship={onViewRelationship} />
  </div>;
}

function CatAvatar({ mini = false, scarf = false, action = "idle" }: { mini?: boolean; scarf?: boolean; action?: string }) {
  return <div className={`pet-cat ${mini ? "mini" : ""} ${scarf ? "with-scarf" : ""} action-${action}`} aria-hidden="true">
    <span className="cat-tail" />
    <span className="cat-body"><i className="cat-belly" /><i className="cat-paw left" /><i className="cat-paw right" /></span>
    <span className="cat-head"><i className="cat-ear left" /><i className="cat-ear right" /><i className="cat-stripe stripe-one" /><i className="cat-stripe stripe-two" /><b className="cat-eye left" /><b className="cat-eye right" /><em className="cat-nose" /><span className="cat-mouth" /><span className="cat-blush left" /><span className="cat-blush right" /></span>
    {scarf && <span className="cat-scarf"><i /></span>}
    {action === "feed" && <span className="cat-treat">★</span>}
    {action === "play" && <span className="cat-heart">♥</span>}
  </div>;
}

const defaultPetGameState: PetGameState = {
  adopted: false,
  name: "糯米",
  level: 1,
  experience: 0,
  fullness: 65,
  food: 0,
  claimedRewards: [],
  equippedOutfit: null,
  equippedDecor: null,
};

function PetGame({ intimacyScore, notify, onViewRelationship }: { intimacyScore: number; notify: (message: string) => void; onViewRelationship: () => void }) {
  const [game, setGame] = useState<PetGameState>(defaultPetGameState);
  const [hydrated, setHydrated] = useState(false);
  const [reaction, setReaction] = useState("在等你一起成长");
  const [petAction, setPetAction] = useState("idle");
  const reactionTimer = useRef<number | null>(null);
  const nextMilestone = petMilestones.find((milestone) => milestone.score > intimacyScore);
  const canAdopt = intimacyScore >= petMilestones[0].score;

  useEffect(() => {
    const loadSavedGame = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem("xingban-pet-game");
        if (saved) {
          const parsed = JSON.parse(saved) as Partial<PetGameState>;
          if (parsed && typeof parsed === "object") {
            setGame({
              ...defaultPetGameState,
              ...parsed,
              claimedRewards: Array.isArray(parsed.claimedRewards) ? parsed.claimedRewards : [],
            });
          }
        }
      } catch {
        window.localStorage.removeItem("xingban-pet-game");
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(loadSavedGame);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem("xingban-pet-game", JSON.stringify(game));
  }, [game, hydrated]);

  useEffect(() => {
    return () => {
      if (reactionTimer.current !== null) window.clearTimeout(reactionTimer.current);
    };
  }, []);

  const showReaction = (message: string, action = "happy") => {
    setReaction(message);
    setPetAction(action);
    if (reactionTimer.current !== null) window.clearTimeout(reactionTimer.current);
    reactionTimer.current = window.setTimeout(() => {
      setReaction("在等你一起成长");
      setPetAction("idle");
    }, 1800);
  };

  const adoptPet = () => {
    if (!canAdopt) {
      notify(`亲密度达到 ${petMilestones[0].score} 后即可领养`);
      return;
    }
    setGame((current) => ({ ...current, adopted: true, claimedRewards: current.claimedRewards.includes("adopt") ? current.claimedRewards : [...current.claimedRewards, "adopt"] }));
    showReaction("终于见到你啦！", "happy");
    notify("已解锁「信任感知」并领养数字宠物糯米");
  };

  const claimReward = (rewardId: string) => {
    const milestone = petMilestones.find((item) => item.id === rewardId);
    if (!milestone || intimacyScore < milestone.score) {
      notify(`还差 ${Math.max(0, (milestone?.score ?? intimacyScore) - intimacyScore)} 点亲密度解锁`);
      return;
    }
    if (!game.adopted && rewardId !== "adopt") {
      notify("先领取亲密属性并领养糯米吧");
      return;
    }
    if (game.claimedRewards.includes(rewardId)) {
      notify("这份奖励已经领取过了");
      return;
    }
    if (rewardId === "adopt") {
      adoptPet();
      return;
    }
    setGame((current) => ({
      ...current,
      food: rewardId === "food" ? current.food + 3 : current.food,
      claimedRewards: [...current.claimedRewards, rewardId],
    }));
    showReaction(rewardId === "food" ? "闻到星星饼干啦！" : "新礼物好喜欢！", "happy");
    notify(`${milestone.title} 已放入宠物小屋`);
  };

  const addExperience = (amount: number, fullnessChange: number) => {
    setGame((current) => {
      const experience = current.experience + amount;
      return { ...current, experience, level: Math.floor(experience / 100) + 1, fullness: Math.max(0, Math.min(100, current.fullness + fullnessChange)) };
    });
  };

  const feedPet = () => {
    if (!game.food) {
      notify("宠物粮不足，继续提升亲密度可以领取");
      return;
    }
    if (game.fullness >= 100) {
      notify("糯米已经吃饱了，陪它玩一会再喂吧");
      showReaction("肚子已经圆滚滚啦！", "happy");
      return;
    }
    setGame((current) => ({
      ...current,
      food: current.food - 1,
      fullness: Math.min(100, current.fullness + 25),
      experience: current.experience + 18,
      level: Math.floor((current.experience + 18) / 100) + 1,
    }));
    showReaction("好吃！成长经验 +18", "feed");
  };

  const playWithPet = () => {
    if (game.fullness <= 10) {
      notify("糯米有点饿，先喂一块星星饼干吧");
      showReaction("饿得玩不动啦…", "idle");
      return;
    }
    addExperience(12, -5);
    showReaction("一起玩真开心！经验 +12", "play");
  };

  const toggleOutfit = () => {
    if (!game.claimedRewards.includes("scarf")) {
      notify("亲密度达到 80 并领取围巾后即可换装");
      return;
    }
    setGame((current) => ({ ...current, equippedOutfit: current.equippedOutfit === "scarf" ? null : "scarf" }));
    showReaction(game.equippedOutfit === "scarf" ? "换回舒服的日常造型" : "今天也要漂漂亮亮！", "dress");
  };

  const toggleDecor = () => {
    if (!game.claimedRewards.includes("moon-bed")) {
      notify("再提升亲密度，月亮小窝会在 90 分解锁");
      return;
    }
    setGame((current) => ({ ...current, equippedDecor: current.equippedDecor === "moon-bed" ? null : "moon-bed" }));
    showReaction("房间变得更温暖啦！", "happy");
  };

  return <div className="pet-game">
    <div className="pet-score-header">
      <div><span>MOMCOZY BOND</span><strong>{intimacyScore}<i>/100</i></strong><small>{nextMilestone ? `距「${nextMilestone.title}」还差 ${nextMilestone.score - intimacyScore} 分` : "全部亲密奖励已解锁"}</small></div>
      <span className="pet-attribute"><i>✦</i><b>永久属性</b><strong>{canAdopt ? "信任感知" : "待解锁"}</strong></span>
    </div>
    <div className="pet-score-track"><i style={{ width: `${intimacyScore}%` }} />{petMilestones.map((milestone) => <span key={milestone.id} className={intimacyScore >= milestone.score ? "reached" : ""} style={{ left: `${milestone.score}%` }} />)}</div>

    <div className="pet-game-columns">
      <div className="pet-care-column">
      {!game.adopted ? <div className="pet-adoption">
      <div className="pet-egg" aria-hidden="true"><span>✦</span></div>
      <span>亲密度 {petMilestones[0].score} 解锁</span>
      <h3>一位新伙伴正在等你</h3>
      <p>领养后，品牌合作沉淀的亲密度会持续为它解锁粮食、服装和小屋装饰。</p>
      <button onClick={adoptPet} disabled={!canAdopt}>领取属性并领养「糯米」</button>
    </div> : <>
      <div className={`pet-room ${game.equippedDecor === "moon-bed" ? "with-moon-bed" : ""}`}>
        <span className="pet-room-spark spark-one">✦</span><span className="pet-room-spark spark-two">·</span>
        {game.equippedDecor === "moon-bed" && <span className="pet-moon-bed" aria-hidden="true">☾</span>}
        <div className="pet-avatar-wrap" role="img" aria-label={`数字宠物小猫${game.name}`}><CatAvatar scarf={game.equippedOutfit === "scarf"} action={petAction} /></div>
        <div className="pet-reaction" aria-live="polite">{reaction}</div>
        <div className="pet-nameplate"><span>{game.name}</span><b>LV.{game.level}</b></div>
      </div>
      <div className="pet-stats">
        <div><span>成长经验</span><b>{game.experience % 100}/100</b><i><em style={{ width: `${game.experience % 100}%` }} /></i></div>
        <div><span>饱食度</span><b>{game.fullness}%</b><i><em style={{ width: `${game.fullness}%` }} /></i></div>
      </div>
      <div className="pet-actions">
        <button onClick={feedPet}><span>★</span><strong>喂食</strong><small>星星饼干 ×{game.food}</small></button>
        <button onClick={playWithPet}><span>♧</span><strong>玩一会</strong><small>成长经验 +12</small></button>
        <button onClick={toggleOutfit}><span>◇</span><strong>{game.equippedOutfit === "scarf" ? "卸下围巾" : "穿戴围巾"}</strong><small>{game.claimedRewards.includes("scarf") ? "已拥有" : "80 分解锁"}</small></button>
        <button onClick={toggleDecor}><span>☾</span><strong>{game.equippedDecor === "moon-bed" ? "收起小窝" : "布置小窝"}</strong><small>{game.claimedRewards.includes("moon-bed") ? "已拥有" : "90 分解锁"}</small></button>
      </div>
      </>}
      </div>

      <div className="pet-growth-column"><div className="pet-milestone-section">
      <div className="pet-section-title"><div><span>GROWTH REWARDS</span><h3>亲密奖励路线</h3></div><button onClick={onViewRelationship}>查看亲密度来源 →</button></div>
      <div className="pet-milestone-list">{petMilestones.map((milestone) => {
        const unlocked = intimacyScore >= milestone.score;
        const claimed = milestone.id === "adopt" ? game.adopted : game.claimedRewards.includes(milestone.id);
        return <div key={milestone.id} className={`${unlocked ? "unlocked" : "locked"} ${claimed ? "claimed" : ""}`}><span>{unlocked ? claimed ? "✓" : "✦" : milestone.score}</span><div><i>{milestone.score} 亲密度 · {milestone.type}</i><strong>{milestone.title}</strong><small>{milestone.description}</small></div><button onClick={() => claimReward(milestone.id)} disabled={!unlocked || claimed}>{claimed ? "已领取" : unlocked ? milestone.id === "adopt" ? "领养" : "领取" : `差 ${milestone.score - intimacyScore} 分`}</button></div>;
      })}</div>
      </div>
      <div className="pet-intimacy-task"><span>最快获得下一份奖励</span><div><strong>完成 S12 Pro 视频上线</strong><small>按时交付并完成品牌验收，预计亲密度 +4</small></div><button onClick={() => notify("已把 S12 Pro 上线任务加入今日清单")}>加入今日任务</button></div></div>
    </div>
  </div>;
}

function SheetSection({ number, title, text }: { number: string; title: string; text: string }) {
  return <div className="sheet-section"><span>{number}</span><div><strong>{title}</strong><p>{text}</p></div></div>;
}

function ToggleRow({ label, note, checked, onChange }: { label: string; note: string; checked: boolean; onChange: () => void }) {
  return <button className="toggle-row" onClick={onChange} role="switch" aria-checked={checked}><div><strong>{label}</strong><small>{note}</small></div><span className={checked ? "on" : ""}><i /></span></button>;
}
