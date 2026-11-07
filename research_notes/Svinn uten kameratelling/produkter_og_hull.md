# Market map: products that find and explain inventory discrepancies and shrink for SMB retail / e-commerce warehouses (incl. warehouse voice), and gaps for a 4-person hackathon team

Research date: 2026-11-07. About 22 search/fetch calls. Several vendor pages could not be fetched directly, so some facts come from search summaries of the cited URLs; these are marked "via search summary". Prices from aggregators (CostBench, Capterra, toolradar) often disagree with each other. Always check the vendor page before quoting in a pitch.

## 0. What is Holio / Holio Ops? (challenge owner)

### Takeaway
Holio AS is a Norwegian "commerce made simple" software company. It sells Holio WMS (from 3 990 kr/month) for online retailers. Holio OPS is the Android app for the warehouse floor (picking, receiving, product editing, order handling) and runs on existing handheld terminals. Holio's public pages do not mention stock counting (varetelling), cycle counts, variance reports or voice. That matches the challenge.

### Cited Findings
- Holio AS (org.nr. 929 395 824), "Commerce made simple", "Laget i Norge". It connects orders, inventory, shipping, purchasing, returns and reporting to the webshop and ERP. Products: Holio WMS, Holio TMS, Holio Shipping, Holio Insights, Ordermatch, Purchase Assist, Return Portal. Accounting and consulting are "coming soon". — [holio.ai](https://holio.ai)
- Holio WMS has six modules: purchase orders, sales orders, products, locations and stock (real-time stock levels for all warehouses and stores, unlimited locations), returns, transport. It sits *behind* the webshop/ERP rather than replacing it. — [holio.ai/software/wms](https://holio.ai/software/wms/)
- Holio OPS is an Android app (Android 9+, Google Play) for picking confirmed "i reolgangen", goods receiving, product editing and order handling. It runs on existing compatible handheld terminals. The page does not single out stock counting. It promises availability "without manual counting". — [holio.ai/software/wms](https://holio.ai/software/wms/)
- Price: Holio WMS "fra 3 990 kr" per month (as of August 2026). It depends on volume and number of locations, and includes all modules, the OPS app, and Shopify/WooCommerce connections. Business NXT ERP is supported. — [holio.ai/software/wms](https://holio.ai/software/wms/)
- Holio Shipping (Shopify app by Holio AS): shipping rates, labels, returns. From $39/month. — [Shopify App Store](https://apps.shopify.com/holio-shipping)
- The Holio blog describes cross-warehouse inventory tracking, real-time dashboards and order routing. — [holio.ai blog](https://holio.ai/blog/a-modern-approach-to-order-management)
- holio.no refused connections when fetched (ECONNREFUSED). The live site appears to be holio.ai.

### Inferences
- Holio's customers are Norwegian webshops / small 3PL-like warehouses on Shopify/WooCommerce/Business NXT, not large grocery chains. A solution should plug into Holio's data model: products/SKUs, locations, purchase orders (receipts), sales orders (picks), and returns. Each of those transaction streams is a candidate "explanation" for a discrepancy.
- Since OPS already does picking and receiving on Android handhelds (Zebra-class devices), a count/recount flow and a voice layer in the same Android app would need no new hardware.

### Gaps
- No public Holio customer list, user counts, or documentation of whether OPS has a counting mode. The help center at help.holio.ai was not fetched. No LinkedIn data retrieved.
- Zebra compatibility is not stated explicitly, only "existing compatible handheld terminals" with Android 9+.

## 1. SMB WMS / inventory / POS modules: counts and variance features

### Takeaway
Almost every SMB system can do a stock count: scan or enter quantities, compare with system on-hand, review the variance, approve the adjustment. Almost none explains *why* the variance happened. Variance "investigation" is left to the user through help articles and recounts. Prices run from about $19/month (count apps) to about $500/month (SMB WMS). Nordic WMS pricing is mostly quote-based.

### Cited Findings
**Shopify (native + apps)**
- A Shopify stock count compares physical stock at a location with recorded on-hand. Staff at locations with Shopify POS Pro can count in the POS app. Approving the count applies the difference and records it in adjustment history. — [Shopify Help: Stock counts](https://help.shopify.com//manual/products/inventory/inventory-counts) (via search summary); [Shopify changelog: run inventory counts in POS](https://changelog.shopify.com/posts/run-inventory-counts-in-pos)
- ShelfCount (Shopify app): $19/month, 14-day trial. Camera or Bluetooth scanner, multiple staff in one session, review expected vs counted before applying. — [Shopify App Store: ShelfCount](https://apps.shopify.com/shelfcount)
- Count Comfort: $49/month Starter. Every variance is reviewed before changes are applied. — [pickyourapp](https://pickyourapp.com/products/count-comfort)
- Typical "investigate variances" guidance (HL POS help desk, Ramp RFID): count outside trading hours, recount unusual variances. Common causes are misplaced items, loose tags, insufficient scanning and unrecorded sales. — [HL POS: How to investigate stocktake variances](https://hlposteam.freshdesk.com/support/solutions/articles/51000492096-how-to-investigate-stocktake-variances); [Ramp RFID](https://support.ramprfid.com/knowledge/importing-a-stocktake-to-shopify)

**Sitoo (Swedish cloud POS, Nordic retail)**
- Stocktaking can be done in Backoffice, through Excel import, or in the Sitoo POS app by scanning barcodes. A central stocktaking must be started in Backoffice before lists are submitted. Each participant should have their own login so contributions are traceable. Lists can be paused for sales. — [Sitoo support: Best practice stocktaking](https://support.sitoo.com/hc/en-us/articles/360010630459-Best-Practice-Stocktaking); [Counting products when stocktaking](https://support.sitoo.com/hc/en-us/articles/360002211180-Counting-products-when-stocktaking)
- No public Sitoo pricing found.

**Lightspeed Retail**
- Inventory Counts plus adjustments to fix discrepancies. — [Lightspeed UK product page](https://product-info.lightspeedhq.com/lightspeed-retail-x-series-lightspeed-inventory-management-uk/)
- Price: sources conflict. $89/$149/$289 per month (Basic/Core/Plus) per [CostBench](https://www.costbench.com/software/inventory-management/lightspeed-inventory/), versus $109/$179/$339 per [PricingSaaS](https://pricingsaas.com/companies/lightspeed).

**Square for Retail** (comparison point)
- Has an explicit inventory variance report: view, compare, export and adjust. — [Square help 8251](https://squareup.com/help/us/en/article/8251-view-and-export-inventory-variance-report-with-square-for-retail)

**Zoho Inventory / inFlow / Sortly**
- Zoho Inventory: the free plan has 50 orders/month, 1 user, 1 location. Standard $29/month (annual). The top tier was cut 16.7% to $249/month in July 2026. — [CostBench changelog](https://costbench.com/changelog/zoho-inventory-price-decrease-2026-07/); [toolradar](https://toolradar.com/tools/zoho-inventory/pricing)
- inFlow: Entrepreneur $129/month; Stockroom $99/month (annual); Manufacturing from $179/month (Aug 2026). An older listing shows from $89/month. — [CostBench inFlow vs Zoho](https://www.costbench.com/compare/inflow-vs-zoho-inventory/); [Capterra inFlow pricing](https://capterra.com/p/78431/inFlow-Inventory/pricing/)
- Sortly: free to $24+/month promo ($49 normal per one source; Capterra lists from $49/month). Item-tracking oriented, with no order management. — [dupple 2026 roundup](https://dupple.com/learn/best-small-business-inventory-management-software); [CostBench](https://costbench.com/software/inventory-management/zoho-inventory/alternatives/)

**SMB WMS price benchmarks**
- Subscription WMS: about $100–300 per user/month plus a $500–2,000/month platform fee. Mid-market e-commerce pays "a few hundred to ~$1,500/month". — [SKUNexus: WMS pricing from 76 buying conversations](https://www.skunexus.com/blog/wms-pricing); [Zenventory WMS pricing comparison](https://www.zenventory.com/wms-pricing-comparison)
- Zenventory: $499/month entry (unlimited users/SKUs). MontaWMS: fixed fee and/or per-order fee. — [Zenventory](https://www.zenventory.com/wms-pricing-comparison); [Monta](https://gomonta.com/en-gb/wms/pricing-wms)
- Ongoing WMS (Swedish) is on the Shopify App Store. No public price was found in this research. — [Shopify App Store: Ongoing WMS](https://apps.shopify.com/ongoing-wms)

### Inferences
- The universal workflow is: count → variance list → approve adjustment. The "why" step is either a human recount or an adjustment reason code. That is the commodity part. A hackathon team should not compete on "doing a count". They should compete on what happens *after* the variance list exists.
- Holio WMS at 3 990 kr/month (about $370) sits in the SMB WMS band. A shrink/variance add-on has to be cheap relative to that, probably a few hundred NOK/month, to be credible.

### Gaps
- Not verified this session: Cin7, Fishbowl, ShipHero, Linnworks, Katana, Stocky, Logiq, Consafe, Extenda, Visma/Tripletex cycle-count features and prices. Ongoing WMS and Sitoo pricing were not found publicly. Shopify POS Pro price was not retrieved with a source.

## 2. Shrink analytics / loss prevention / phantom inventory

### Takeaway
Root-cause shrink analytics exists, but it is enterprise-only, quote-priced, and built for chains with POS/transaction data at scale: Zebra Prescriptive Analytics (ex-Profitect), Agilence, Appriss, invent.ai Phantom Inventory, RELEX "True Inventory", Retail Insight. None of the vendors found offers a conversational or voice interface for asking why stock is missing. None targets a 1–10 store Nordic webshop or warehouse.

### Cited Findings
- Zebra Prescriptive Analytics (built on Profitect, acquired June 2019) prescribes actions "in plain text" with AI/ML and aims to answer what, why (root cause), who and how. Its Inventory Module finds anomalies from vendors, suppliers or stores and identifies root cause and next best action. One example: scanning accuracy was found to be the root cause in receiving, so staff were retrained. Home Depot is a customer. No public pricing. — [Zebra ZPA brochure](https://www.zebra.com/content/dam/archive_zebra_dam/en/brochure/portfolio/zpa-brochure-overview-en-us.pdf); [Zebra investor news 2019](https://investors.zebra.com/news-and-events/news/news-details/2019/Zebra-Technologies-Prescriptive-Analytics-Suite-Helps-The-Home-Depot-Battle-Shrink/default.aspx); [Zebra blog: ORC](https://prodc-www.zebra.com/us/en/blog/posts/2019/prescriptive-analytics-secret-weapon-for-fighting-organized-retail-crime.html)
- NRF figure cited by Zebra material: US retailers lost $112B to shrink in 2022. A Zebra study says 36% of retailers believe better shrink analytics could help profitability. — [salestechstar](https://salestechstar.com/?p=229060) (secondary)
- invent.ai Phantom Inventory looks at sales patterns, volatility and store signals to flag items that "appear in stock but aren't selling", ranks them by lost revenue, and sends daily alerts with exception workflows. Causes it lists: replenishment errors, theft, damaged goods handling, incorrect sales recording. Targets apparel, grocery and specialty retail, at store and DC level. No pricing ("speak with an expert"). No conversational interface. — [invent.ai/phantom-inventory](https://invent.ai/phantom-inventory)
- invent.ai launched a stand-alone Phantom Stock app (per trade press). — [SCXchange](https://www.thescxchange.com/articles/8438-invent-analytics-announces-availability-of-the-phantom-stock-app)
- RELEX added AI predictive inventory capabilities including phantom-inventory detection (Oct 2024). — [BusinessWire](https://www.businesswire.com/news/home/20241002363157/en)
- Retail Insight launched InventoryInsight against phantom inventory. — [salestechstar](https://salestechstar.com/?p=230375)
- Agilence: custom annual SaaS pricing based on locations, transaction volume and integrations, with no public prices (secondary source). Positioned as enterprise. An older IPVM review says its analyst service is most attractive to chains of 50 stores or fewer. Vendor claims a 33x ROI. — [rfp.wiki](https://www.rfp.wiki/vendors/agilence); [Fitgap](https://us.fitgap.com/products/agilence); [IPVM](https://ipvm.com/updates/118)
- Appriss Retail writes about the "other side of shrink": poor inventory record accuracy. — [Appriss Retail](https://apprissretail.com/resources/the-other-side-of-shrink-managing-poor-inventory-record-accuracy-percentages/)
- Everseen (camera-based checkout loss prevention) is noted only, since it is out of scope (camera). — [rfp.wiki Agilence vs Everseen](https://www.rfp.wiki/retail-ecommerce/retail-loss-prevention-software/agilence/everseen)
- Academic: a 2025 conference paper proposes federated learning plus autoencoders for phantom-inventory anomaly detection, positioned as low-cost for small retailers. — [ICAISDA 2025, Atlantis Press](https://www.atlantis-press.com/proceedings/icaisda-25/126022694)

### Inferences
- The enterprise vendors' core trick is rule- and anomaly-based detection on transaction logs: zero-sales streaks for SKUs that show stock, unusual manual returns, receiving mismatches. The *logic* can be reproduced at small scale on Holio-like data (PO receipts, picks, returns, adjustments, per-user activity) without cameras. Small customers lack the "plain-text explanation" layer, which an LLM can generate.
- Zero-sales-while-in-stock is especially relevant for webshops. Phantom stock causes oversells and cancellations, which hurt webshops more visibly than physical stores.

### Gaps
- No published prices for Zebra ZPA, Appriss, Crisp, Afresh, Invent, RELEX, Retail Insight. Crisp and Afresh were not researched (both are grocery/CPG forecasting, adjacent at best).

## 3. Counting apps and services

### Takeaway
Phone-based scanning (Scandit) and cheap Shopify count apps solve *capturing* the count. They do not explain variances. Scandit is priced per device, at roughly EUR 300/device/year in one listing.

### Cited Findings
- Scandit MatrixScan Count: batch scan-and-count for receiving, inventory and cycle counting. Included in Scandit Express "Inventory Count" alongside SparkScan. — [Scandit MatrixScan Count](https://scandit.com/products/matrixscan-count); [Scandit docs](https://docs.scandit.com/hosted/express/configuration/inventory-count)
- Scandit Express 10-device pack: EUR 3,050/year, 2-year minimum, per active device (SAP partner listing). An aggregator lists Express Core at $50/month and says SDK/enterprise pricing is custom. — [SAP partner listing](https://www.sap.com/greece/products/crm/partners/scandit-ag-scandit-smart-data-capture.html); [getpulsesignal](https://getpulsesignal.com/pricing/scandit)
- Shopify count apps at $19–49/month (see section 1).

### Inferences
- Because the team uses existing barcode scanners and phones, Scandit is a substitute rather than a dependency. The Zebra handheld's built-in scanner already does what Scandit sells.

### Gaps
- Not researched: RGIS and other service counters, Stocktake Online, Count It, Scanbot, Nordic count apps.

## 4. Voice for warehouses

### Takeaway
Classic warehouse voice (Honeywell Vocollect, Voxware, Lucas Jennifer, topsystem Lydia) is *voice-directed work*: the system tells the worker where to go, the worker reads a check digit, says the quantity, and the system confirms. Cycle counting by voice is an established workflow, sometimes done in-line with picking. Pricing is quote/reseller based. Most of these need headsets and enterprise WMS integration. LLM-style "ask why" voice for managers is only now appearing: AutoScheduler.AI added voice plus explainable AI to its Warehouse Decision Agent in April 2026, for decisions rather than shrink. No SMB product was found that lets a manager ask "why is X missing?" by voice.

### Cited Findings
- Vocollect: one case reports 90% of cycle counts done by voice and nearly half in-line with picking. Check digits verify location, and random check digits enforce accuracy. Vendor claims include more than 99% accuracy and 10–20% picking productivity gains. Pricing is negotiated through resellers, and G2 has no list price. — [MMH: Vocollect beyond picking](https://www.mmh.com/article/vocollect_helps_users_expand_use_of_voice_beyond_picking); [Dexion whitepaper](https://www.dexion.com.au/whitepaper/vocollect-voice-vs-pick-to-light-ss/); [G2 Vocollect](https://www.g2.com/products/vocollect/reviews)
- The only per-user dollar figure found is old: a 2011 Vocollect release claims savings (not cost) of more than $450/user/year (case) and more than $2,400/user/year (piece picking). — [LogisticsIT 2011](https://www.logisticsit.com/articles/2011/02/10/5458-next-generation-vocollect-voice-solution-set-unveiled-enabling-the-voice-centric-warehouse)
- Lucas Systems Jennifer: "AI-powered" orchestration with voice-directed mobile apps (dual speech engines, DNNs). No cycle-count specifics or pricing were found. — [Lucas Systems](https://www.lucasware.com/company/how-we-work/); [SC247](https://www.supplychain247.com/article/lucas_systems_previews_new_ai_based_tools)
- Voxware: Voice Management Suite (device-agnostic, WMS-integrated). VoxPilot is the analytics layer for real-time visibility. Hardware is sold as a subscription (Zebra devices). No evidence that VoxPilot has a natural-language or voice Q&A feature for managers. — [Puerto Rico Supplies Group case study](https://www.casestudies.com/company/voxware/case-study/puerto-rico-supplies-group-customer-case-study); [HarperCollins case study (99.98% accuracy)](https://www.casestudies.com/company/voxware/case-study/harpercollins-customer-case-study)
- topsystem Lydia Voice (Ehrhardt Partner Group): used for picking and inventory. Its Lydia Smart Assistant extended voice to Android smartphones, tablets and watches (2018). Lydia Warehouse Intelligence analyzes process, user and device data. The iOS app is a picking demo. — [MotionMiners supplier page](https://mpi.motionminers.com/en/suppliers/topsystem); [Verkehrsrundschau](https://www.verkehrsrundschau.de/nachrichten/lager-umschlag/logimat-lydia-versteht-dialekt-2986798); [App Store: Lydia Voice](https://apps.apple.com/us/app/id1568501762)
- AutoScheduler.AI (7 April 2026): added voice-activated interfacing and explainable AI to its Warehouse Decision Agent so managers get explanations of optimization decisions ("decision overload"). The press release does not specify whether managers can ask open questions. No price. — [briefglance summary of GlobeNewswire release](https://briefglance.com/companies/autoscheduler-ai-inc/pulses/3058)

### Inferences
- Two distinct voice paradigms exist. (a) **Worker voice**, which is mature: directed tasks, check digits, spoken quantities. This maps directly to a *guided blind recount by voice*: "Go to A-03-2. Say the check digit. How many of SKU X?" — without revealing the expected quantity. (b) **Manager conversational voice**, which is nascent: "Why is X short?" Classic vendors have analytics dashboards but no conversational root-cause analysis. AutoScheduler is the closest, and it targets enterprise orchestration, not shrink.
- Classic voice requires dedicated headsets, WMS integration projects and quote-based pricing. A browser/Android ElevenLabs agent on existing phones and Zebra devices removes that hardware cost. That is a concrete differentiator.

### Gaps
- No current per-user price for Vocollect, Voxware, Lucas or Lydia. Ehrhardt Partner and Speechmatics were not researched separately. No 2024–2026 LLM voice-agent startups for warehouses were found besides AutoScheduler (callsphere/digiqt blog posts exist but are generic marketing).

## 5. Nordic startups in retail ops / shrink / inventory accuracy

### Takeaway
No Nordic startup focused on explaining SMB inventory discrepancies or shrink ("svinn") was found. Nordic players are POS/WMS vendors (Sitoo, Ongoing, Holio, Bitlog) or automation (AutoStore). This suggests open space, with the caveat that the search coverage was limited.

### Cited Findings
- Searches for Nordic shrink/inventory-accuracy startups returned only AutoStore (Norwegian storage automation) and generic explainers. Norwegian retailers use RELEX for planning (secondary). — [AutoStore Wikipedia](https://en.wikipedia.org/wiki/AutoStore); [Nucamp Norway retail AI](https://www.nucamp.co/blog/coding-bootcamp-norway-nor-retail-how-ai-is-helping-retail-companies-in-norway-cut-costs-and-improve-efficiency)
- Nordic WMS/POS seen: Ongoing WMS (SE), Bitlog WMS (SE), Sitoo POS (SE), Holio (NO). — [Ongoing on Shopify](https://apps.shopify.com/ongoing-wms); [Bitlog WMS](https://apps.apple.com/tr/app/bitlog-wms/id1623818906); [Sitoo](https://sitoo.com/solution/pos)

### Inferences
- The absence of results is weak evidence. Shifter.no, e24, Dagens Handel and Sifted were not searched directly.

### Gaps
- Logiq, Consafe, Extenda, Visma/Tripletex, and Norwegian startup press were not covered.

## 6. Gaps a small team could hit (synthesis)

### Takeaway
The commodity layer is count capture plus a variance list. The unserved layer for small Nordic merchants is **explaining** each variance from the transaction trail, and acting on it with a **voice-guided blind recount** on hardware they already own. Enterprise tools have the explanation logic but not the price or the conversational interface. Voice vendors have counting by voice but not explanation or SMB pricing.

### Cited Findings
- SMB tools stop at approving the adjustment, and variance investigation is manual advice (recount, count outside hours) — [Shopify Help](https://help.shopify.com//manual/products/inventory/inventory-counts); [HL POS](https://hlposteam.freshdesk.com/support/solutions/articles/51000492096-how-to-investigate-stocktake-variances)
- Root-cause and plain-text prescriptions exist only in enterprise, quote-priced tools — [Zebra ZPA](https://www.zebra.com/content/dam/archive_zebra_dam/en/brochure/portfolio/zpa-brochure-overview-en-us.pdf); [Agilence via rfp.wiki](https://www.rfp.wiki/vendors/agilence); [invent.ai](https://invent.ai/phantom-inventory)
- Voice cycle counting with check digits is proven but tied to enterprise voice stacks — [MMH Vocollect](https://www.mmh.com/article/vocollect_helps_users_expand_use_of_voice_beyond_picking)
- Manager voice plus explainable AI only appeared in April 2026, in enterprise orchestration — [AutoScheduler via briefglance](https://briefglance.com/companies/autoscheduler-ai-inc/pulses/3058)
- Holio OPS has picking and receiving but no documented counting — [holio.ai/software/wms](https://holio.ai/software/wms/)

### Inferences (team's own reasoning, not sourced)
1. **"Hvorfor mangler det?" — conversational root-cause analysis.** For each SKU/location variance, rank candidate explanations from the data: recent receipt quantity ≠ PO quantity, a pick from the wrong location (an adjacent bin showing the opposite variance, i.e. a swap), a return not restocked, an unrecorded damaged write-off, sales while counting (timing), one user/shift linked to many adjustments, or zero sales for N days while stock is positive (phantom). The manager asks by voice and the agent answers with evidence and a confidence level. Nothing found offers this for SMB.
2. **Voice-guided blind recount on existing devices.** The agent sends a worker to the top-N suspicious bins, asks for the check digit or location barcode scan, then asks "how many?" without revealing the expected quantity. This uses the proven Vocollect-style pattern (check digit + spoken quantity) but runs on phones/Zebra handhelds with an ElevenLabs agent, with no headsets or voice server.
3. **Prioritized "which shelves to count today" list** (risk-based cycle counting) driven by the root-cause signals above, instead of full stocktakes. This directly answers the challenge text "find the shelves with discrepancies".
4. **Norwegian-language voice.** Classic vendors emphasize dialect handling (Lydia "versteht Dialekt"), and Norwegian support in SMB tools is unverified. An ElevenLabs agent in Norwegian is a local differentiator.
5. **Price point.** It must sit well under Holio WMS's 3 990 kr/month and the enterprise analytics tools. A per-location add-on inside Holio OPS is the plausible packaging.
6. **Webshop angle.** Phantom stock causes oversells. Linking variance explanations to cancelled orders makes the cost visible to e-commerce merchants.

### Gaps
- No user interviews or quantified Norwegian SMB shrink data in this file. No verification that Holio has transaction-level logs (per-user adjustments and timestamps) exposed via its API. That should be asked of Holio at the hackathon.
