"use client";

import { useEffect, useState } from "react";

type View = "today" | "opportunities" | "studio" | "video" | "review" | "profile";
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

const navItems: { id: View; label: string; icon: string; badge?: string }[] = [
  { id: "today", label: "今日", icon: "⌂" },
  { id: "opportunities", label: "合作机会", icon: "◇", badge: "3" },
  { id: "studio", label: "爆款创作", icon: "✦" },
  { id: "video", label: "AI 视频", icon: "▶" },
  { id: "review", label: "数据复盘", icon: "↗" },
];

const viewTitles: Record<View, { eyebrow: string; title: string; subtitle: string }> = {
  today: { eyebrow: "MONDAY · 09:24", title: "早上好，Mia", subtitle: "今天只做最值得做的事。" },
  opportunities: { eyebrow: "OPPORTUNITY MATCH", title: "为你精选的合作", subtitle: "每个推荐都有依据，你决定是否申请。" },
  studio: { eyebrow: "VIRAL CONTENT STUDIO", title: "把好产品讲成好内容", subtitle: "从真实受众信号出发，而不是套一个爆款模板。" },
  video: { eyebrow: "AI VIDEO LAB", title: "把脚本变成可发布视频", subtitle: "保留你的表达，AI 负责耗时的制作环节。" },
  review: { eyebrow: "GROWTH REVIEW", title: "看懂这次，拍好下一次", subtitle: "从内容表现到商业结果，给出明确的下一步。" },
  profile: { eyebrow: "CREATOR ASSET", title: "你的红人资产", subtitle: "让每次创作与合作，都变成可积累的职业信用。" },
};

function Mark({ children, tone = "dark" }: { children: React.ReactNode; tone?: "dark" | "light" }) {
  return <span className={`mark mark-${tone}`}>{children}</span>;
}

function AppIcon({ symbol, accent = false }: { symbol: string; accent?: boolean }) {
  return <span className={`app-icon ${accent ? "app-icon-accent" : ""}`}>{symbol}</span>;
}

export default function Home() {
  const [view, setView] = useState<View>("today");
  const [selectedProduct, setSelectedProduct] = useState<Product>(products[0]);
  const [applicationState, setApplicationState] = useState<"idle" | "draft" | "submitted">("idle");
  const [showApply, setShowApply] = useState(false);
  const [showAgent, setShowAgent] = useState(true);
  const [toast, setToast] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "agent", text: "我已经看过你最近 30 天的内容和新合作。今天建议先确认 S12 Pro 的合作方向，再完成开头 3 秒脚本。" },
  ]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const openOpportunity = (product: Product) => {
    setSelectedProduct(product);
    setView("opportunities");
  };

  const goTo = (next: View) => {
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const sendMessage = (preset?: string) => {
    const value = (preset || chatInput).trim();
    if (!value) return;
    const reply = value.includes("脚本")
      ? "可以。我建议用‘凌晨 3 点，我终于不用开灯找吸奶器了’开场，先给真实处境，再在第 6 秒自然带出产品。要我把它展开成 35 秒分镜吗？"
      : value.includes("适合") || value.includes("机会")
        ? "S12 Pro 最适合你。依据是受众阶段、夜间育儿内容的收藏表现，以及你过去的真实喂养表达。报酬和授权期也在你的偏好范围内。"
        : "收到。我会优先结合你的账号数据、合作规则和个人表达来给建议；任何申请、报价和发布动作都会先交给你确认。";
    setMessages((current) => [...current, { role: "user", text: value }, { role: "agent", text: reply }]);
    setChatInput("");
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
            <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => goTo(item.id)}>
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
            <span><strong>Mia Chen</strong><small>@miamomlife</small></span>
            <b>···</b>
          </button>
        </div>
      </aside>

      <main className={`main-content ${showAgent ? "with-agent" : ""}`}>
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-symbol small"><i /><i /><i /></span><b>星伴</b></div>
          <div className="page-heading">
            <span>{header.eyebrow}</span>
            <h1>{header.title}</h1>
            <p>{header.subtitle}</p>
          </div>
          <div className="top-actions">
            <button className="round-btn notification-btn" aria-label="查看通知">●<span /></button>
            <button className={`agent-toggle ${showAgent ? "active" : ""}`} onClick={() => setShowAgent(!showAgent)}>
              <Mark tone={showAgent ? "dark" : "light"}>✦</Mark>
              AI 经纪人
            </button>
          </div>
        </header>

        <section className="view-container">
          {view === "today" && <TodayView onOpen={openOpportunity} onGo={goTo} />}
          {view === "opportunities" && (
            <OpportunityView
              selected={selectedProduct}
              onSelect={setSelectedProduct}
              onApply={() => setShowApply(true)}
              applicationState={applicationState}
              onGo={goTo}
            />
          )}
          {view === "studio" && <StudioView product={selectedProduct} onGo={goTo} notify={setToast} />}
          {view === "video" && <VideoView notify={setToast} />}
          {view === "review" && <ReviewView onGo={goTo} />}
          {view === "profile" && <ProfileView notify={setToast} />}
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
        />
      )}

      <nav className="mobile-nav" aria-label="移动端导航">
        {navItems.slice(0, 5).map((item) => (
          <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => goTo(item.id)}>
            <AppIcon symbol={item.icon} />
            <span>{item.label.replace("合作机会", "机会").replace("爆款创作", "创作").replace("数据复盘", "复盘")}</span>
          </button>
        ))}
      </nav>

      {showApply && (
        <ApplyModal
          product={selectedProduct}
          state={applicationState}
          onClose={() => setShowApply(false)}
          onDraft={() => {
            setApplicationState("draft");
            setToast("AI 已生成申请草稿");
          }}
          onSubmit={() => {
            setApplicationState("submitted");
            setShowApply(false);
            setToast("申请已提交，Momcozy 通常会在 2–3 个工作日内回复");
          }}
        />
      )}
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </div>
  );
}

function TodayView({ onOpen, onGo }: { onOpen: (p: Product) => void; onGo: (v: View) => void }) {
  const [tasks, setTasks] = useState([
    { id: 1, label: "确认 S12 Pro 合作方向", meta: "合作机会 · 今天", done: false, view: "opportunities" as View },
    { id: 2, label: "完成开头 3 秒脚本", meta: "爆款创作 · 约 8 分钟", done: false, view: "studio" as View },
    { id: 3, label: "回复 Momcozy 补充信息", meta: "品牌建联 · 截止 18:00", done: true, view: "opportunities" as View },
  ]);
  const toggleTask = (id: number) => setTasks((all) => all.map((task) => task.id === id ? { ...task, done: !task.done } : task));

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
            <div><span className="section-eyebrow">TODAY'S FLOW</span><h3>今天的成长清单</h3></div>
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
        <section className="mini-section">
          <div className="mini-title"><span>合作进度</span><button onClick={() => onGo("opportunities")}>全部</button></div>
          <div className="collab-timeline">
            <div className="timeline-item active"><span><i>✓</i></span><div><strong>Momcozy KleanPal</strong><small>脚本待确认 · 今天</small></div></div>
            <div className="timeline-line" />
            <div className="timeline-item"><span><i>2</i></span><div><strong>Momcozy S12 Pro</strong><small>等待你申请</small></div></div>
            <div className="timeline-line muted" />
            <div className="timeline-item muted"><span><i>3</i></span><div><strong>成长复盘</strong><small>发布后自动生成</small></div></div>
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

function OpportunityView({ selected, onSelect, onApply, applicationState, onGo }: {
  selected: Product; onSelect: (p: Product) => void; onApply: () => void; applicationState: string; onGo: (v: View) => void;
}) {
  const [filter, setFilter] = useState("全部");
  const filtered = filter === "全部" ? products : products.filter((p) => p.category.includes(filter) || (filter === "高佣金" && parseInt(p.commission) >= 12));
  return (
    <div className="opportunity-layout">
      <div className="opportunity-list-side">
        <div className="filter-row">
          {["全部", "母婴", "高佣金", "可寄样"].map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}
          <span>{filtered.length} 个适配机会</span>
        </div>
        <div className="opportunity-list">
          {filtered.map((product) => (
            <button className={`opportunity-card ${selected.id === product.id ? "selected" : ""}`} key={product.id} onClick={() => onSelect(product)}>
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
          <div className="brief-head"><h3>合作简报</h3><button>查看完整 Brief ↗</button></div>
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
          <button className="primary-btn" onClick={onApply}>{applicationState === "submitted" ? "已提交申请 ✓" : applicationState === "draft" ? "继续完成申请 →" : "让 AI 帮我申请 →"}</button>
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

function StudioView({ product, onGo, notify }: { product: Product; onGo: (v: View) => void; notify: (m: string) => void }) {
  const [angle, setAngle] = useState(0);
  const [hookVersion, setHookVersion] = useState(0);
  const angles = [
    { title: "凌晨 3 点的真实崩溃", reason: "强共鸣", detail: "从不想吵醒宝宝，却需要开灯找设备的瞬间切入。" },
    { title: "新手妈妈少买一件没用的东西", reason: "强利益", detail: "用省时、安静、可移动三个场景回答购买焦虑。" },
    { title: "我坚持了 7 天才敢说", reason: "强信任", detail: "用连续体验而非开箱，建立真实使用证据。" },
  ];
  const hooks = [
    "凌晨 3 点，我终于不用开灯找吸奶器了。",
    "这是我产后最不后悔的一次‘偷懒’。",
    "如果你也在夜里喂奶，先别划走。",
  ];
  return (
    <div className="studio-layout">
      <section className="studio-context">
        <div className="selected-product-strip"><ProductThumb product={product} /><div><span>正在为这个合作创作</span><strong>{product.name}</strong></div><button>更换</button></div>
        <div className="signal-card">
          <span className="section-eyebrow">YOUR UNIQUE SIGNAL</span>
          <h2>你最有机会打动人的，<br />不是产品参数，是<strong>深夜的松一口气</strong>。</h2>
          <p>来自你最近 12 条内容、126 条购买意向评论与 Momcozy 过往高表现内容的交叉分析。</p>
          <div className="signal-proof"><span><b>1.8×</b> 夜间场景完播</span><span><b>+42</b> 求链接评论</span><span><b>Top 12%</b> 同类收藏率</span></div>
        </div>
        <div className="angle-section">
          <div className="section-title-row"><div><span className="section-eyebrow">CREATIVE ANGLES</span><h3>选择一个内容切角</h3></div><button className="text-btn" onClick={() => notify("已根据最新趋势刷新内容切角")}>重新发现 ↻</button></div>
          <div className="angle-list">{angles.map((item, i) => <button key={item.title} onClick={() => setAngle(i)} className={angle === i ? "active" : ""}><span>0{i + 1}</span><div><strong>{item.title}</strong><small>{item.detail}</small></div><em>{item.reason}</em></button>)}</div>
        </div>
      </section>
      <section className="script-panel">
        <div className="script-top"><div><span>35 秒短视频脚本</span><h3>{angles[angle].title}</h3></div><span className="saved-state">● 已自动保存</span></div>
        <div className="hook-box"><div><span>HOOK · 0–3s</span><button onClick={() => setHookVersion((v) => (v + 1) % hooks.length)}>换一个 ↻</button></div><blockquote>“{hooks[hookVersion]}”</blockquote><small>镜头：昏暗卧室，手持近景。先出现你，再出现产品。</small></div>
        <div className="script-timeline">
          <ScriptBeat time="03–08s" label="冲突" copy="以前每次夜醒，我都要摸黑找零件，宝宝刚睡着又被吵醒。" direction="保留环境音，不要配乐" />
          <ScriptBeat time="08–18s" label="体验" copy="这周我把 S12 Pro 放在床边，它不用手扶，我可以一边整理第二天的东西。" direction="生活流跟拍 + 产品使用特写" />
          <ScriptBeat time="18–28s" label="证据" copy="最明显的是声音小、贴合稳，而且奶量在屏幕上就能看见。" direction="用真实刻度画面，不做功效承诺" />
          <ScriptBeat time="28–35s" label="行动" copy="如果你也在经历夜间喂养，我把真实使用细节放在评论区。" direction="看镜头，自然结束" />
        </div>
        <div className="compliance-check"><span>✓</span><div><strong>品牌要求检查通过</strong><small>已包含产品全名、#ad 提醒；无未经证实的功效表述。</small></div><button>查看 6 项</button></div>
        <div className="script-actions"><button className="secondary-btn" onClick={() => notify("脚本已保存到创作项目")}>保存脚本</button><button className="primary-btn" onClick={() => onGo("video")}>用这个脚本生成视频 →</button></div>
      </section>
    </div>
  );
}

function ScriptBeat({ time, label, copy, direction }: { time: string; label: string; copy: string; direction: string }) {
  return <div className="script-beat"><span className="beat-time">{time}</span><span className="beat-dot" /><div><span>{label}</span><p>{copy}</p><small>{direction}</small></div></div>;
}

function VideoView({ notify }: { notify: (m: string) => void }) {
  const [ratio, setRatio] = useState("9:16");
  const [voice, setVoice] = useState("保留我的原声");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!generating) return;
    const timer = window.setInterval(() => setProgress((current) => {
      if (current >= 100) {
        window.clearInterval(timer);
        setGenerating(false);
        setReady(true);
        return 100;
      }
      return current + 10;
    }), 180);
    return () => window.clearInterval(timer);
  }, [generating]);
  const start = () => { setReady(false); setProgress(0); setGenerating(true); };
  return (
    <div className="video-layout">
      <section className="video-settings">
        <div className="project-status"><div className="status-icon">✦</div><div><span>来自爆款创作</span><strong>凌晨 3 点的真实崩溃</strong><small>35 秒 · 5 个分镜 · 合规检查已通过</small></div><button>查看脚本</button></div>
        <div className="setting-group"><div className="setting-title"><span>01</span><div><strong>选择你的素材</strong><small>AI 会优先保留真人出镜片段</small></div></div><div className="upload-grid"><button className="upload-box"><span>＋</span><strong>上传本次拍摄</strong><small>支持视频、照片、产品素材</small></button><div className="asset-box asset-one"><span>00:08</span><i>✓</i><small>夜间床边.mov</small></div><div className="asset-box asset-two"><span>00:12</span><i>✓</i><small>产品使用.mov</small></div></div></div>
        <div className="setting-group"><div className="setting-title"><span>02</span><div><strong>设定成片风格</strong><small>所有选项生成前都可以修改</small></div></div><div className="option-rows"><div className="option-row"><span>视频比例</span><div>{["9:16", "1:1", "16:9"].map((item) => <button key={item} className={ratio === item ? "active" : ""} onClick={() => setRatio(item)}>{item}</button>)}</div></div><div className="option-row"><span>声音</span><div>{["保留我的原声", "AI 清晰化", "AI 配音"].map((item) => <button key={item} className={voice === item ? "active" : ""} onClick={() => setVoice(item)}>{item}</button>)}</div></div><div className="option-row"><span>字幕</span><div><button className="active">中文 + 重点高亮</button><button>中英双语</button></div></div></div></div>
        <div className="rights-box"><span>盾</span><div><strong>你的素材，你的决定</strong><small>本次素材仅用于生成当前项目，不会自动授权给品牌或用于模型训练。</small></div><button>隐私设置</button></div>
      </section>
      <aside className="preview-panel">
        <div className="preview-head"><div><span>AI 成片预览</span><small>{ratio} · 1080P</small></div><button>···</button></div>
        <div className={`phone-preview ${ready ? "ready" : ""}`}>
          <div className="phone-scene"><span className="scene-moon">◐</span><div className="scene-person"><i /><b /></div><div className="scene-product">S12</div><div className="caption-line"><span>凌晨 3 点</span><strong>终于不用开灯了</strong></div><div className="video-progress"><i /></div></div>
          {generating && <div className="generate-overlay"><div className="spinner" /><strong>正在生成你的成片</strong><span>{progress}% · 正在匹配镜头与节奏</span><div><i style={{ width: `${progress}%` }} /></div></div>}
        </div>
        <div className="preview-summary"><div><span>预计成片</span><b>00:35</b></div><div><span>素材使用</span><b>7 / 11</b></div><div><span>预计生成</span><b>约 18 秒</b></div></div>
        {!ready ? <button className="primary-btn full-btn" disabled={generating} onClick={start}>{generating ? `正在生成 ${progress}%` : "生成第一版成片 ✦"}</button> : <div className="ready-actions"><button className="secondary-btn" onClick={start}>再生成一版</button><button className="primary-btn" onClick={() => notify("成片已保存，可以进入发布前检查")}>保存成片 →</button></div>}
        <p className="generation-cost">本次生成预计消耗 1 个视频额度 · 本月剩余 8 个</p>
      </aside>
    </div>
  );
}

function ReviewView({ onGo }: { onGo: (v: View) => void }) {
  const [metric, setMetric] = useState("播放趋势");
  const chartValues = metric === "播放趋势" ? [18, 32, 26, 52, 48, 70, 82, 76, 92, 86] : metric === "互动趋势" ? [24, 28, 42, 38, 58, 64, 55, 72, 68, 80] : [12, 18, 22, 20, 32, 40, 52, 48, 62, 72];
  const points = chartValues.map((v, i) => `${i * 11.1},${100 - v}`).join(" ");
  return (
    <div className="review-layout">
      <section className="review-hero">
        <div><span className="section-eyebrow">AUG 26 — SEP 01</span><h2>你的内容不只涨了播放，<br />还更接近<strong>可持续变现</strong>。</h2><p>本周发布 4 条内容，其中 2 条进入账号近 90 天 Top 10%。</p></div>
        <div className="review-badge"><span>本周成长</span><strong>↑ 18</strong><small>超过 76% 同阶段创作者</small></div>
      </section>
      <div className="metric-grid"><MetricCard label="总播放" value="482K" change="+38.2%" note="较上周" accent /><MetricCard label="平均完播" value="41.8%" change="+7.4%" note="表现健康" /><MetricCard label="购买意向" value="126" change="+49" note="条有效评论" /><MetricCard label="预估佣金" value="$1,284" change="+22.6%" note="待平台确认" /></div>
      <div className="review-middle">
        <section className="chart-card">
          <div className="chart-head"><div>{["播放趋势", "互动趋势", "转化信号"].map((item) => <button className={metric === item ? "active" : ""} onClick={() => setMetric(item)} key={item}>{item}</button>)}</div><span>近 30 天⌄</span></div>
          <div className="chart-value"><strong>{metric === "播放趋势" ? "1.28M" : metric === "互动趋势" ? "86.4K" : "1,042"}</strong><span>↑ 24.8% 对比上周期</span></div>
          <div className="css-chart"><div className="grid-lines"><i /><i /><i /><i /></div><svg viewBox="0 0 100 105" preserveAspectRatio="none" aria-label={`${metric}折线图`}><defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fb6d4c" stopOpacity=".3"/><stop offset="100%" stopColor="#fb6d4c" stopOpacity="0"/></linearGradient></defs><polygon points={`0,105 ${points} 100,105`} fill="url(#chartFill)"/><polyline points={points} fill="none" stroke="#f46342" strokeWidth="2" vectorEffect="non-scaling-stroke" /></svg><div className="x-axis"><span>8/08</span><span>8/15</span><span>8/22</span><span>8/29</span><span>9/01</span></div></div>
        </section>
        <section className="diagnosis-card"><div className="diagnosis-head"><Mark>✦</Mark><div><span>AI 复盘结论</span><strong>这周真正有效的 3 件事</strong></div></div><ol><li><span>01</span><div><strong>真人先出镜，再露产品</strong><p>前 3 秒留存平均高出 19%，信任建立更快。</p></div></li><li><span>02</span><div><strong>“深夜”是你的强场景</strong><p>收藏率和购买意向同时提升，不只是流量波动。</p></div></li><li><span>03</span><div><strong>明确说出不便，比罗列参数有效</strong><p>带具体处境的视频，评论转化信号高 2.1 倍。</p></div></li></ol><button className="primary-btn" onClick={() => onGo("studio")}>带着结论创作下一条 →</button></section>
      </div>
      <section className="content-ranking"><div className="section-title-row"><div><span className="section-eyebrow">CONTENT BREAKDOWN</span><h3>内容表现拆解</h3></div><button className="text-btn">导出周报 ↗</button></div><div className="ranking-table"><div className="table-head"><span>内容</span><span>播放 / 完播</span><span>互动</span><span>转化信号</span><span>Agent 判断</span></div><RankRow rank="01" title="凌晨喂奶，我最怕的不是困" meta="TikTok · 8月30日" theme="night" views="186K / 52%" engagement="12.8K" signal="68" verdict="值得复用" /><RankRow rank="02" title="新手妈妈别急着囤这些" meta="Reels · 8月28日" theme="warm" views="142K / 46%" engagement="9.4K" signal="37" verdict="开头很强" /><RankRow rank="03" title="我的夜间喂养收纳台" meta="TikTok · 8月26日" theme="soft" views="94K / 38%" engagement="6.1K" signal="21" verdict="优化转场" /></div></section>
    </div>
  );
}

function MetricCard({ label, value, change, note, accent = false }: { label: string; value: string; change: string; note: string; accent?: boolean }) {
  return <div className={`metric-card ${accent ? "accent" : ""}`}><span>{label}</span><strong>{value}</strong><div><b>{change}</b><small>{note}</small></div></div>;
}

function RankRow({ rank, title, meta, theme, views, engagement, signal, verdict }: { rank: string; title: string; meta: string; theme: string; views: string; engagement: string; signal: string; verdict: string }) {
  return <div className="table-row"><span className="rank">{rank}</span><span className={`video-thumb ${theme}`}><i>▶</i></span><span className="content-name"><strong>{title}</strong><small>{meta}</small></span><span>{views}</span><span>{engagement}</span><span><b>{signal}</b> 条</span><span className="verdict-pill">{verdict}</span></div>;
}

function ProfileView({ notify }: { notify: (m: string) => void }) {
  return (
    <div className="profile-layout">
      <section className="profile-card-main"><div className="profile-hero"><span className="avatar avatar-large">M</span><div><span className="verified-line">已验证创作者 · TikTok / Instagram</span><h2>Mia Chen</h2><p>真实记录新手妈妈的育儿生活，让好用的东西减少一点手忙脚乱。</p><div className="profile-tags"><i>母婴生活</i><i>真实体验</i><i>北美华人</i><i>生活流短视频</i></div></div><button className="secondary-btn" onClick={() => notify("资料编辑功能已打开")}>编辑资料</button></div><div className="asset-metrics"><div><span>全平台粉丝</span><strong>286K</strong><small>近 30 天 +8.4%</small></div><div><span>商业内容均播</span><strong>118K</strong><small>基于 16 条合作</small></div><div><span>准时交付率</span><strong>96%</strong><small>连续 8 次按时</small></div><div><span>品牌复投率</span><strong>62%</strong><small>高于同阶段均值</small></div></div></section>
      <div className="profile-columns"><section className="capability-card"><div className="section-title-row"><div><span className="section-eyebrow">CAPABILITY MAP</span><h3>创作者能力图谱</h3></div><span className="level-pill">成长期 · L3</span></div><div className="bar-list"><Capability label="场景叙事" value={88} /><Capability label="受众信任" value={84} /><Capability label="商业转化" value={76} /><Capability label="镜头表现" value={72} /><Capability label="稳定交付" value={91} /></div></section><section className="brand-history"><div className="section-title-row"><div><span className="section-eyebrow">BRAND RELATIONSHIP</span><h3>品牌合作资产</h3></div><span>12 次合作</span></div><div className="history-brand"><span>M</span><div><strong>Momcozy</strong><small>合作 4 次 · 复投 2 次</small></div><em>优先合作池</em></div><div className="history-brand"><span>H</span><div><strong>Hatch</strong><small>合作 2 次 · 复投 1 次</small></div><em>稳定合作</em></div><div className="history-brand"><span>B</span><div><strong>Babylist</strong><small>合作 1 次 · 已完成</small></div><em>关系良好</em></div></section></div>
      <section className="next-level-card"><div><Mark>✦</Mark><span className="section-eyebrow">NEXT MILESTONE</span><h3>距离「品牌共创者」还差一步</h3><p>完成一次从选品到复盘的完整合作闭环，并保持内容完播率 ≥ 40%。</p></div><div className="milestone-progress"><span><i style={{ width: "76%" }} /></span><div><b>76%</b><button onClick={() => notify("已加入本周成长清单")}>加入本周目标 →</button></div></div></section>
    </div>
  );
}

function Capability({ label, value }: { label: string; value: number }) {
  return <div><span>{label}</span><i><b style={{ width: `${value}%` }} /></i><strong>{value}</strong></div>;
}

function AgentPanel({ messages, chatInput, setChatInput, sendMessage, close, onGo }: {
  messages: { role: string; text: string }[]; chatInput: string; setChatInput: (v: string) => void; sendMessage: (p?: string) => void; close: () => void; onGo: (v: View) => void;
}) {
  return (
    <aside className="agent-panel">
      <div className="agent-head"><div><span className="agent-orb">✦</span><span><strong>星伴</strong><small><i /> AI 经纪人在线</small></span></div><button onClick={close} aria-label="关闭 AI 经纪人">×</button></div>
      <div className="agent-body">
        <div className="agent-context"><span>正在了解</span><div><b>你今天的重点</b><small>合作机会 · 内容创作 · 数据表现</small></div></div>
        <div className="message-list">{messages.map((message, i) => <div className={`message ${message.role}`} key={`${message.role}-${i}`}>{message.role === "agent" && <span>✦</span>}<p>{message.text}</p></div>)}</div>
        <div className="quick-prompts"><button onClick={() => sendMessage("为什么 S12 Pro 适合我？")}>为什么这个机会适合我？</button><button onClick={() => sendMessage("帮我优化视频脚本")}>帮我优化今天的视频脚本</button></div>
        <div className="agent-action-card"><span>建议下一步</span><strong>先确认合作，再开始创作</strong><p>这样生成的脚本会自动带上品牌要求，减少返工。</p><button onClick={() => onGo("opportunities")}>去确认合作 <span>→</span></button></div>
      </div>
      <div className="agent-input"><div><textarea aria-label="给 AI 经纪人发消息" rows={1} placeholder="问选品、合作或创作…" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} /><button onClick={() => sendMessage()} aria-label="发送消息">↑</button></div><small>AI 可能出错，重要合作信息请确认。</small></div>
    </aside>
  );
}

function ApplyModal({ product, state, onClose, onDraft, onSubmit }: { product: Product; state: string; onClose: () => void; onDraft: () => void; onSubmit: () => void }) {
  const [statement, setStatement] = useState(state === "draft" ? "你好，我是 Mia。我专注记录新手妈妈的真实育儿生活，近期‘夜间带娃’内容获得了高收藏和明确的产品询问。我希望用真实的凌晨喂养场景，呈现 S12 Pro 如何让夜间流程更从容。" : "");
  const [generated, setGenerated] = useState(state === "draft");
  const generate = () => { setStatement("你好，我是 Mia。我专注记录新手妈妈的真实育儿生活，近期‘夜间带娃’内容获得了高收藏和明确的产品询问。我希望用真实的凌晨喂养场景，呈现 S12 Pro 如何让夜间流程更从容。"); setGenerated(true); onDraft(); };
  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="apply-modal" role="dialog" aria-modal="true" aria-labelledby="apply-title">
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-kicker"><Mark>✦</Mark><span>AI 申请助理</span></div>
        <h2 id="apply-title">申请 {product.name}</h2>
        <p className="modal-subtitle">我会用你可验证的资料起草申请，不会编造数据或自动发送。</p>
        <div className="application-summary"><span><b>合作报酬</b>{product.fee} + {product.commission}</span><span><b>内容交付</b>{product.tags[0]} · {product.tags[1]}</span></div>
        <label className="statement-field"><span><b>申请说明</b><em>{statement.length}/500</em></span><textarea value={statement} onChange={(e) => setStatement(e.target.value)} placeholder="点击下方按钮，让 AI 根据你的资料起草…" /></label>
        <div className="evidence-note"><span>✓</span><p><strong>使用了 3 项可验证信息</strong><small>创作者定位、近 30 天内容表现、已验证代表作</small></p><button>查看依据</button></div>
        {!generated ? <button className="generate-draft-btn" onClick={generate}><Mark tone="light">✦</Mark> 生成我的申请草稿</button> : <div className="modal-actions"><button className="secondary-btn" onClick={generate}>重新生成</button><button className="primary-btn" disabled={!statement.trim()} onClick={onSubmit}>确认并提交申请 →</button></div>}
        <p className="human-note">提交后 Momcozy 才会收到。报价、合同与发布仍由你本人确认。</p>
      </div>
    </div>
  );
}
