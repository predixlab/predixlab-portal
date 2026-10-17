export type LegalDocumentType = 'terms' | 'privacy'

interface LegalSection {
  title: string
  paragraphs: string[]
  items?: string[]
}

export interface LegalDocument {
  title: string
  summary: string
  effectiveDate: string
  sections: LegalSection[]
}

const documents: Record<'en' | 'zh', Record<LegalDocumentType, LegalDocument>> = {
  en: {
    terms: {
      title: 'Terms of Service',
      summary:
        'These Terms govern your access to PredixLab, including market data, model signals, screening, historical analysis and paid subscriptions.',
      effectiveDate: 'Effective and last updated: August 9, 2026',
      sections: [
        {
          title: '1. Agreement and service provider',
          paragraphs: [
            'These Terms of Service form a binding agreement between you and the operator of PredixLab ("PredixLab", "we", "us" or "our"). By creating an account, accessing the service or purchasing a subscription, you agree to these Terms, the Privacy Policy and the User Notice and Risk Disclosure.',
            'If you use PredixLab on behalf of an organization, you represent that you have authority to bind that organization. If you do not agree to these Terms, do not access or use the service.',
          ],
        },
        {
          title: '2. Eligibility and accounts',
          paragraphs: [
            'You must have legal capacity to enter into this agreement and must not be prohibited from using the service under applicable law. PredixLab is not directed to children.',
            'You must provide accurate account information, keep access to your email and authentication providers secure, and promptly notify us of suspected unauthorized use. You are responsible for activity conducted through your account unless applicable law provides otherwise.',
          ],
        },
        {
          title: '3. Service scope and changes',
          paragraphs: [
            'PredixLab provides software tools for reviewing market data, model-generated signals, stock screening, options activity and historical signal performance. Features, data coverage, calculations, access limits and supported markets may change.',
            'We may modify, suspend or discontinue all or part of the service for maintenance, security, legal, technical or business reasons. Where reasonably practicable, we will provide notice of material changes that adversely affect paid access.',
          ],
        },
        {
          title: '4. Financial information and risk',
          paragraphs: [
            'PredixLab is an information and analysis service. It does not provide investment, brokerage, legal or tax advice and does not execute trades. No output is a personalized recommendation, offer or solicitation.',
            'Market data can be delayed, incomplete or incorrect. Models, scores, backtests and historical results may contain assumptions and do not predict or guarantee future performance. You are solely responsible for verifying information and for your investment decisions. The User Notice and Risk Disclosure forms part of these Terms.',
          ],
        },
        {
          title: '5. Permitted use and restrictions',
          paragraphs: [
            'We grant you a limited, personal, non-exclusive, non-transferable and revocable right to use PredixLab for lawful internal analysis during the term of your account.',
          ],
          items: [
            'Do not resell, sublicense, redistribute, publish or commercially exploit the service or its data unless we expressly authorize it in writing.',
            'Do not scrape, bulk download, systematically extract or create a substitute dataset from the service except through an expressly authorized interface.',
            'Do not reverse engineer, bypass access controls, probe security, interfere with operation, introduce malicious code or use automated traffic that unreasonably burdens the service.',
            'Do not use PredixLab for unlawful, deceptive, manipulative or abusive activity, including market manipulation or infringement of another person’s rights.',
            'Do not share account access or attempt to access features or data beyond your authorized plan.',
          ],
        },
        {
          title: '6. Third-party data and services',
          paragraphs: [
            'PredixLab may rely on market-data sources, cloud providers, authentication providers and payment processors. Third-party content remains subject to its owner’s rights and may be changed, delayed or withdrawn.',
            'Google, Microsoft, Stripe and other third parties operate under their own terms and privacy policies. We are not responsible for third-party services beyond the extent required by applicable law.',
          ],
        },
        {
          title: '7. Paid subscriptions, renewal and cancellation',
          paragraphs: [
            'Available plans, prices, taxes, billing intervals and any trial period are shown before checkout. Payments are processed by Stripe. By purchasing a recurring plan, you authorize the applicable charge at the start of each billing period until cancellation.',
            'You may cancel from your account settings. Unless the checkout terms state otherwise, cancellation takes effect at the end of the current paid period and access continues until then. Fees already paid are non-refundable except where required by law or expressly stated at checkout. We may change future prices with advance notice; the new price applies from a subsequent renewal.',
          ],
        },
        {
          title: '8. Intellectual property and feedback',
          paragraphs: [
            'PredixLab, its software, interface, models, documentation, branding and original content are owned by us or our licensors and are protected by intellectual-property laws. These Terms do not transfer ownership to you.',
            'If you submit feedback, you grant us a worldwide, perpetual, irrevocable, royalty-free right to use it without restriction or compensation, provided we do not publicly identify you without permission.',
          ],
        },
        {
          title: '9. Suspension and termination',
          paragraphs: [
            'You may stop using PredixLab at any time. We may restrict or terminate access if you materially breach these Terms, create security or legal risk, fail to pay applicable fees, or misuse the service. Where appropriate, we will provide notice and an opportunity to remedy the breach.',
            'Upon termination, your right to use the service ends. Provisions that by their nature should survive, including ownership, payment obligations, disclaimers and limitations of liability, remain effective.',
          ],
        },
        {
          title: '10. Disclaimers',
          paragraphs: [
            'To the maximum extent permitted by law, PredixLab is provided "as is" and "as available". We disclaim implied warranties of merchantability, fitness for a particular purpose, non-infringement, accuracy and uninterrupted availability.',
            'We do not warrant that data, signals, calculations or other outputs will be complete, timely, error-free or suitable for any trading or investment purpose. Nothing in these Terms excludes a warranty or right that cannot lawfully be excluded.',
          ],
        },
        {
          title: '11. Limitation of liability',
          paragraphs: [
            'To the maximum extent permitted by law, PredixLab and its operators, affiliates, licensors and service providers will not be liable for indirect, incidental, special, consequential, exemplary or punitive damages, loss of profits, trading losses, loss of data, loss of opportunity or business interruption arising from the service.',
            'Our aggregate liability arising from the service will not exceed the greater of the amount you paid to PredixLab during the twelve months before the event giving rise to the claim or USD 100. These limits do not apply to fraud, willful misconduct, death or personal injury caused by negligence, or other liability that cannot lawfully be limited.',
          ],
        },
        {
          title: '12. Governing terms and disputes',
          paragraphs: [
            'These Terms are governed by the laws applicable to the PredixLab operator, without regard to conflict-of-law rules. Courts with jurisdiction over that operator have exclusive jurisdiction, except where mandatory consumer law gives you the right to bring a claim elsewhere.',
            'Before filing a claim, each party should attempt in good faith to resolve the dispute by written notice. Nothing in this section prevents either party from seeking urgent injunctive relief.',
          ],
        },
        {
          title: '13. Changes and contact',
          paragraphs: [
            'We may update these Terms. If a change is material, we will provide notice through the service and request renewed acceptance where appropriate. Continued use after the effective date constitutes acceptance only to the extent permitted by law.',
            'Questions about these Terms may be sent to contact@predixlab.com. Notices to you may be delivered through the service or to the email associated with your account.',
          ],
        },
      ],
    },
    privacy: {
      title: 'Privacy Policy',
      summary:
        'This Policy explains what personal data PredixLab collects, why it is used, when it is shared and the choices available to you.',
      effectiveDate: 'Effective and last updated: September 7, 2026',
      sections: [
        {
          title: '1. Scope and responsible party',
          paragraphs: [
            'This Privacy Policy applies to PredixLab websites, applications and related account, support and subscription services. The operator of PredixLab is responsible for the personal data described in this Policy.',
            'Third-party services linked from PredixLab have their own privacy practices. This Policy does not govern information a third party collects directly from you.',
          ],
        },
        {
          title: '2. Information we collect',
          paragraphs: ['We collect the following categories of information:'],
          items: [
            'Account data, including email address, display name, preferred language, role, verification status and account timestamps.',
            'Authentication data, including verification-code records, session and refresh-token records, and identifiers received from Google or Microsoft when you choose OAuth login. We do not receive your OAuth password.',
            'Usage and device data, including requested pages and API resources, timestamps, IP address, user agent, error records, feature interactions and security events.',
            'When Google Analytics is configured on the public website, it receives basic measurement requests, including page URLs and titles, referral information, timestamps, device and browser information, and consent state, even before you make a cookie choice or when you decline analytics cookies. These requests do not use analytics cookies. If you allow analytics cookies, Google Analytics may also use browser identifiers to measure repeat visits and sessions.',
            'Subscription data, including plan, billing interval, subscription status, Stripe customer and subscription identifiers, and transaction status. Stripe processes payment-card details; PredixLab does not store full card numbers.',
            'Communications and preferences you provide when contacting support, updating your profile or submitting feedback.',
          ],
        },
        {
          title: '3. How we use information',
          paragraphs: ['We use personal data to:'],
          items: [
            'Create and secure accounts, send verification codes, authenticate sessions and prevent abuse.',
            'Provide market-analysis features, remember language and interface preferences, and apply subscription access rules.',
            'Process subscriptions, maintain billing records and respond to payment or account requests.',
            'Operate, troubleshoot, measure and improve service reliability, performance and usability.',
            'Communicate service, security, legal and subscription updates, and send optional product updates where permitted.',
            'Comply with law, enforce our agreements and protect users, PredixLab and third parties.',
          ],
        },
        {
          title: '4. Legal bases',
          paragraphs: [
            'Where applicable law requires a legal basis, we process data to perform our contract with you, comply with legal obligations, pursue legitimate interests such as security and service improvement, and obtain consent where required.',
            'You may withdraw consent at any time for future processing, but withdrawal does not affect processing already performed or processing based on another lawful ground.',
          ],
        },
        {
          title: '5. How information is shared',
          paragraphs: [
            'We do not sell personal data. We may disclose information to service providers that process it on our behalf, including hosting, database, email-delivery, authentication, monitoring and customer-support providers.',
            'Stripe receives information needed to process subscriptions. Google and Microsoft receive information when you choose their login services. When public-site analytics is configured, Google receives basic measurement data without analytics cookies, and cookie-based measurement data if you allow analytics cookies. We may also disclose data when required by law, to protect rights or safety, in connection with a corporate transaction, or with your direction or consent.',
          ],
        },
        {
          title: '6. Cookies and local storage',
          paragraphs: [
            'PredixLab uses browser storage and similar technologies to maintain authentication, remember interface preferences and support security. Essential storage is necessary for requested functionality.',
            'When configured, Google Analytics loads using Advanced Consent Mode with analytics and advertising storage denied by default. Basic measurement requests are sent without analytics cookies. Selecting “Allow analytics cookies” enables analytics storage; selecting “No analytics cookies” or withdrawing this permission disables analytics storage but does not stop basic measurement requests. Advertising storage, advertising user data and ad personalization remain denied. You can change your cookie choice from “Analytics preferences” in the website footer. The preference is stored in your browser. Clearing browser storage may reset that preference and other interface settings.',
          ],
        },
        {
          title: '7. International processing',
          paragraphs: [
            'Our providers and systems may process information in countries other than your own. Those countries may have different data-protection laws.',
            'Where required, we use recognized transfer mechanisms or other safeguards. Contact us if you need information about safeguards relevant to your data.',
          ],
        },
        {
          title: '8. Retention',
          paragraphs: [
            'We retain personal data only as long as reasonably necessary for the purposes described here, including account operation, security, dispute resolution, legal compliance and financial recordkeeping.',
            'Retention periods vary by data type. Authentication codes are short-lived; account and subscription records may be retained while the account is active and for a legally required or defensible period afterward. Data may persist temporarily in protected backups.',
          ],
        },
        {
          title: '9. Security',
          paragraphs: [
            'We use administrative, technical and organizational measures designed to protect personal data, including access controls, authentication, transport security and restricted service-provider access.',
            'No system is completely secure. You should protect access to your email and OAuth accounts and notify us promptly if you suspect unauthorized use.',
          ],
        },
        {
          title: '10. Your rights and choices',
          paragraphs: [
            'Depending on your location, you may have rights to access, correct, delete, restrict or object to processing, receive a portable copy, withdraw consent, or lodge a complaint with a data-protection authority.',
            'You may update certain profile information or permanently delete your account from the service. Account deletion ends active Stripe billing before removing account-owned data; legally required financial records and protected backups may be retained for the periods described above. Optional product emails can be disabled from the unsubscribe link in those messages without affecting verification, security or billing emails. For other requests, contact contact@predixlab.com.',
          ],
        },
        {
          title: '11. Children',
          paragraphs: [
            'PredixLab is not intended for children, and we do not knowingly collect personal data from a child who cannot lawfully consent to the service. If you believe a child has provided personal data, contact us so we can investigate and take appropriate action.',
          ],
        },
        {
          title: '12. Policy changes and contact',
          paragraphs: [
            'We may update this Policy as our service, providers or legal obligations change. We will publish the revised date and provide additional notice or request renewed acceptance when required.',
            'Privacy questions and requests may be sent to contact@predixlab.com.',
          ],
        },
      ],
    },
  },
  zh: {
    terms: {
      title: '服务条款',
      summary:
        '本条款适用于您对 PredixLab 的访问和使用，包括市场数据、模型信号、股票筛选、历史分析及付费订阅。',
      effectiveDate: '生效及最近更新日期：2026 年 8 月 9 日',
      sections: [
        {
          title: '1. 协议成立与服务提供方',
          paragraphs: [
            '本《服务条款》是您与 PredixLab 运营方（以下简称“PredixLab”或“我们”）之间具有约束力的协议。创建账户、访问服务或购买订阅，即表示您同意本条款、《隐私政策》及《用户须知与风险披露》。',
            '如果您代表组织使用 PredixLab，您确认有权使该组织受本协议约束。如果您不同意本条款，请勿访问或使用服务。',
          ],
        },
        {
          title: '2. 使用资格与账户',
          paragraphs: [
            '您应具备订立本协议所需的法律行为能力，且适用法律不得禁止您使用本服务。PredixLab 不面向儿童。',
            '您应提供准确的账户信息，妥善保护邮箱和第三方认证账户，并在发现未经授权的使用时及时通知我们。除适用法律另有规定外，您应对通过自己账户发生的活动负责。',
          ],
        },
        {
          title: '3. 服务范围与变更',
          paragraphs: [
            'PredixLab 提供用于查看市场数据、模型信号、股票筛选、期权异动和历史信号表现的软件工具。功能、数据覆盖、计算方式、访问限制和支持市场可能发生变化。',
            '我们可能因维护、安全、法律、技术或经营原因修改、暂停或终止全部或部分服务。在合理可行的情况下，对于实质影响付费访问的变更，我们会提前通知。',
          ],
        },
        {
          title: '4. 金融信息与风险',
          paragraphs: [
            'PredixLab 是信息与分析服务，不提供投资、经纪、法律或税务建议，也不执行交易。任何输出均不构成个性化推荐、要约或招揽。',
            '市场数据可能延迟、缺失或错误。模型、评分、回测和历史结果可能包含假设，不能预测或保证未来表现。您应自行核实信息并对投资决定负责。《用户须知与风险披露》是本条款的组成部分。',
          ],
        },
        {
          title: '5. 许可使用与限制',
          paragraphs: [
            '在您的账户有效期间，我们授予您有限的、个人的、非独占、不可转让且可撤销的权利，仅限您为合法的内部分析目的使用 PredixLab。',
          ],
          items: [
            '未经我们书面授权，不得转售、再许可、重新分发、公开发布或商业利用本服务或其中的数据。',
            '除通过明确授权的接口外，不得抓取、批量下载、系统性提取服务内容或据此建立替代性数据集。',
            '不得逆向工程、绕过访问控制、探测安全措施、干扰服务运行、植入恶意代码，或使用对服务造成不合理负担的自动化流量。',
            '不得将 PredixLab 用于违法、欺骗、操纵或滥用活动，包括市场操纵或侵犯他人权利。',
            '不得共享账户访问权限，也不得尝试访问超出当前授权方案的功能或数据。',
          ],
        },
        {
          title: '6. 第三方数据与服务',
          paragraphs: [
            'PredixLab 可能依赖市场数据源、云服务商、认证服务商和支付处理商。第三方内容仍受其权利人约束，并可能发生变更、延迟或停止提供。',
            'Google、Microsoft、Stripe 及其他第三方适用其各自的条款和隐私政策。除适用法律要求外，我们不对第三方服务承担责任。',
          ],
        },
        {
          title: '7. 付费订阅、续费与取消',
          paragraphs: [
            '可用方案、价格、税费、计费周期及试用期会在结账前展示。付款由 Stripe 处理。购买自动续费方案即表示您授权在每个计费周期开始时扣取相应费用，直至取消。',
            '您可以在账户设置中取消。除结账条件另有说明外，取消在当前付费周期结束时生效，届时之前仍可继续使用。已支付费用不予退还，但法律强制要求或结账页面明确约定的情况除外。我们可能提前通知未来价格调整，新价格从后续续费周期开始适用。',
          ],
        },
        {
          title: '8. 知识产权与反馈',
          paragraphs: [
            'PredixLab 的软件、界面、模型、文档、品牌和原创内容归我们或许可方所有，并受知识产权法律保护。本条款不会向您转移所有权。',
            '如果您提交反馈，即授予我们全球范围、永久、不可撤销、免许可费且不受限制的使用权，但未经许可我们不会公开识别您的身份。',
          ],
        },
        {
          title: '9. 暂停与终止',
          paragraphs: [
            '您可以随时停止使用 PredixLab。如果您严重违反本条款、造成安全或法律风险、未支付应付费用或滥用服务，我们可能限制或终止访问。在适当情况下，我们会通知并给予合理的改正机会。',
            '服务终止后，您的使用权随即终止。按照性质应继续有效的条款，包括所有权、付款义务、免责声明及责任限制，仍然有效。',
          ],
        },
        {
          title: '10. 免责声明',
          paragraphs: [
            '在法律允许的最大范围内，PredixLab 按“现状”和“可用”状态提供。我们不作适销性、特定用途适用性、不侵权、准确性或持续可用性的默示保证。',
            '我们不保证数据、信号、计算或其他输出完整、及时、无误，或适合任何交易或投资目的。本条款不排除法律不得排除的保证或权利。',
          ],
        },
        {
          title: '11. 责任限制',
          paragraphs: [
            '在法律允许的最大范围内，PredixLab 及其运营方、关联方、许可方和服务商不对因服务产生的间接、附带、特殊、后果性、惩罚性损失，利润损失、交易损失、数据丢失、机会损失或业务中断承担责任。',
            '我们因服务产生的责任总额不超过导致索赔事件发生前十二个月内您向 PredixLab 支付的金额与 100 美元两者中的较高者。该限制不适用于欺诈、故意不当行为、因过失造成的死亡或人身伤害，以及法律不得限制的其他责任。',
          ],
        },
        {
          title: '12. 适用规则与争议',
          paragraphs: [
            '本条款适用 PredixLab 运营方所在地的法律，但不适用法律冲突规则。对该运营方有管辖权的法院具有专属管辖权，但强制性消费者法律允许您在其他地点起诉的除外。',
            '提出索赔前，双方应通过书面通知善意尝试解决争议。本节不妨碍任何一方申请紧急禁令救济。',
          ],
        },
        {
          title: '13. 条款更新与联系',
          paragraphs: [
            '我们可能更新本条款。发生重大变更时，我们会通过服务通知，并在适当情况下要求重新确认。仅在法律允许的范围内，生效日期后的继续使用视为接受。',
            '如对本条款有疑问，请联系 contact@predixlab.com。我们可能通过服务内通知或账户关联邮箱向您发送通知。',
          ],
        },
      ],
    },
    privacy: {
      title: '隐私政策',
      summary:
        '本政策说明 PredixLab 收集哪些个人信息、使用目的、共享场景以及您可以行使的选择和权利。',
      effectiveDate: '生效及最近更新日期：2026 年 9 月 7 日',
      sections: [
        {
          title: '1. 适用范围与责任方',
          paragraphs: [
            '本《隐私政策》适用于 PredixLab 网站、应用及相关账户、支持与订阅服务。PredixLab 运营方负责本政策所述个人信息的处理。',
            '从 PredixLab 链接的第三方服务有各自的隐私规则。本政策不适用于第三方直接向您收集的信息。',
          ],
        },
        {
          title: '2. 我们收集的信息',
          paragraphs: ['我们可能收集以下类别的信息：'],
          items: [
            '账户信息，包括邮箱、显示名称、首选语言、账户角色、验证状态及账户时间记录。',
            '认证信息，包括验证码记录、会话和刷新令牌记录，以及您选择 OAuth 登录时从 Google 或 Microsoft 获取的标识符。我们不会获得您的 OAuth 密码。',
            '使用和设备信息，包括请求的页面与 API 资源、时间戳、IP 地址、用户代理、错误记录、功能交互及安全事件。',
            '公开网站配置 Google Analytics 后，即使您尚未选择或拒绝分析 Cookie，Google 仍会接收基础衡量请求，包括页面网址和标题、来源信息、时间戳、设备和浏览器信息以及同意状态。这些请求不使用分析 Cookie。如果您允许分析 Cookie，Google Analytics 还可使用浏览器标识符衡量重复访问和会话。',
            '订阅信息，包括方案、计费周期、订阅状态、Stripe 客户与订阅标识符，以及交易状态。支付卡信息由 Stripe 处理，PredixLab 不存储完整卡号。',
            '您在联系支持、更新资料或提交反馈时提供的通信内容与偏好。',
          ],
        },
        {
          title: '3. 信息使用方式',
          paragraphs: ['我们将个人信息用于：'],
          items: [
            '创建和保护账户、发送验证码、验证会话及防止滥用。',
            '提供市场分析功能、保存语言与界面偏好，并执行订阅访问规则。',
            '处理订阅、维护账单记录，以及响应付款或账户请求。',
            '运营、排查、衡量和改善服务可靠性、性能与可用性。',
            '发送服务、安全、法律和订阅相关通知，并在法律允许时发送可选产品动态。',
            '遵守法律、执行协议，并保护用户、PredixLab 和第三方。',
          ],
        },
        {
          title: '4. 处理依据',
          paragraphs: [
            '在适用法律要求明确处理依据的地区，我们为履行与您的合同、遵守法律义务、实现安全和服务改进等合法利益而处理信息，并在法律要求时取得同意。',
            '您可以随时撤回对未来处理的同意，但撤回不影响已经完成的处理，也不影响基于其他合法依据进行的处理。',
          ],
        },
        {
          title: '5. 信息共享',
          paragraphs: [
            '我们不出售个人信息。我们可能向代表我们处理信息的服务商披露信息，包括托管、数据库、邮件发送、身份认证、监控和客户支持服务商。',
            'Stripe 会接收处理订阅所需的信息。选择 Google 或 Microsoft 登录时，相应服务商会接收必要信息。公开网站配置分析功能后，Google 会接收不使用分析 Cookie 的基础衡量数据；如果您允许分析 Cookie，还会接收基于 Cookie 的衡量数据。我们也可能在法律要求、保护权利或安全、企业交易，或经您指示或同意时披露信息。',
          ],
        },
        {
          title: '6. Cookie 与本地存储',
          paragraphs: [
            'PredixLab 使用浏览器存储及类似技术维持认证状态、保存界面偏好并支持安全功能。必要存储是提供您所请求功能所必需的。',
            '配置 Google Analytics 后，网站会以高级同意模式加载，默认拒绝分析和广告存储，并在不使用分析 Cookie 的情况下发送基础衡量请求。选择“允许分析 Cookie”会启用分析存储；选择“不使用分析 Cookie”或撤回许可会禁用分析存储，但不会停止基础衡量请求。广告存储、广告用户数据及广告个性化始终保持拒绝。您可以通过网站页脚的“网站统计设置”随时修改 Cookie 选择。该偏好保存在浏览器中；清除浏览器存储可能会重置该偏好和其他界面设置。',
          ],
        },
        {
          title: '7. 跨境处理',
          paragraphs: [
            '我们的服务商和系统可能在您所在国家或地区之外处理信息，该地区的数据保护法律可能不同。',
            '在法律要求时，我们会采用认可的传输机制或其他保护措施。如需了解与您信息相关的保护措施，请联系我们。',
          ],
        },
        {
          title: '8. 保存期限',
          paragraphs: [
            '我们仅在实现本政策所述目的的合理必要期间保存个人信息，包括账户运营、安全、争议处理、法律合规及财务记录。',
            '不同信息的保存期限不同。验证码仅短期保存；账户和订阅记录可能在账户有效期间及其后法律要求或合理抗辩所需期间保存。受保护的备份中可能暂时保留数据。',
          ],
        },
        {
          title: '9. 信息安全',
          paragraphs: [
            '我们采取旨在保护个人信息的管理、技术和组织措施，包括访问控制、身份认证、传输安全和限制服务商访问。',
            '任何系统都无法保证绝对安全。您应妥善保护邮箱和 OAuth 账户，并在怀疑未经授权使用时及时通知我们。',
          ],
        },
        {
          title: '10. 您的权利与选择',
          paragraphs: [
            '根据您所在地区，您可能有权访问、更正、删除信息，限制或反对处理，获取可携带副本，撤回同意，或向数据保护监管机构投诉。',
            '您可以在服务中更新部分账户信息或永久删除账户。删除账户时，我们会先终止当前 Stripe 扣费，再删除账户拥有的数据；法律要求保留的财务记录和受保护备份可按前述期限继续保存。您可通过可选产品邮件中的退订链接停止此类邮件，验证码、安全通知和账单邮件不受影响。其他请求请联系 contact@predixlab.com。',
          ],
        },
        {
          title: '11. 儿童信息',
          paragraphs: [
            'PredixLab 不面向儿童，我们不会故意收集依法不能自行同意使用服务的儿童个人信息。如果您认为儿童提供了个人信息，请联系我们，以便调查并采取适当措施。',
          ],
        },
        {
          title: '12. 政策更新与联系',
          paragraphs: [
            '随着服务、供应商或法律义务变化，我们可能更新本政策。我们会公布更新日期，并在法律要求时提供额外通知或要求重新确认。',
            '隐私问题和权利请求请发送至 contact@predixlab.com。',
          ],
        },
      ],
    },
  },
}

export const getLegalDocument = (
  language: string,
  type: LegalDocumentType,
): LegalDocument => documents[language.startsWith('zh') ? 'zh' : 'en'][type]
