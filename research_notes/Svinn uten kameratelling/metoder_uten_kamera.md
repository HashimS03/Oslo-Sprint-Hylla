# Non-camera methods for finding and explaining inventory discrepancies and shrink (phones + handheld EAN scanners + voice)

Scope note: Research done 2026-11-07, about 20 tool calls. Many industry numbers come from vendors, such as Honeywell/Vocollect case studies and loss-prevention software blogs. Each one is marked as vendor material. Academic numbers come mostly from abstracts and secondary citations, because the full texts (INFORMS, Wiley) were paywalled or returned 403. Each finding is labelled with its year.

## 1. Cycle counting variants (ABC, blind, zero/low-stock, opportunity-based, exception-triggered, risk-based, location audits) vs annual stocktake

### Takeaway
Store inventory records are wrong for most SKUs: 60–65% of records in two large studies. Counting more often, and targeting the counts, measurably fixes records and lifts sales by about 4–11%. Controlled studies isolating specific variants (blind, opportunity, ABC) are scarce. Evidence for those variants is mostly practitioner or vendor material.

### Cited Findings
- DeHoratius & Raman (Management Science, 2008) examined nearly 370,000 inventory records from 37 stores of one retailer and found 65% inaccurate. Inventory auditing practices reduced inaccuracy, while store complexity and the distribution structure increased it. — [EconPapers/RePEc listing](https://econpapers.repec.org/RePEc:inm:ormnsc:v:54:y:2008:i:4:p:627-641); [SUFE academic newsletter summary](https://academicnewsletter.sufe.edu.cn/info/394446)
- A secondary summary of DeHoratius & Raman says 26.4% of the variance in inaccuracy lies between product categories and only 2.7% between stores. This suggests targeting counts by category or SKU rather than by store. (Secondary source; not verified against the full text.) — [search-result summary via SUFE newsletter](https://academicnewsletter.sufe.edu.cn/info/394446)
- ECR / Rekik et al. (2019): 7 retailers in 4 European countries (grocery and fashion), about 233,000 products, a 24-week experiment with 2 stores per retailer. About 60% of inventory records were inaccurate. The store that counted more often (start, middle and end, correcting each time, versus only start and end) had 3.83%–8.38% higher sales, 5.98% on average. — [Internet Retailing, 25 Nov 2019](https://internetretailing.net/?p=38723); [ORCA Cardiff record](https://orca.cardiff.ac.uk/142664)
- Rekik, Oliva, Glock & Syntetos (arXiv 2025, revised 2026): about 24,000 SKUs in 11 grocery stores. Inaccuracy was higher for items with higher average inventory, more frequent restocking, and perishability, and lower for items with more promotions. An audit produced an 11% store-wide sales lift, concentrated in items where the system showed more stock than was physically present (phantom inventory). — [arXiv 2506.05357](https://arxiv.org/abs/2506.05357)
- Chuang & Oliva (2015): in simulation, backroom and shelf shrinkage were the main drivers of inaccuracy, while recording and shelving errors had negligible impact. Empirically, in 5 stores of a global chain, full-time labour reduced inaccuracy and part-time labour did not. — [EconBiz record](https://www.econbiz.de/Record/inventory-record-inaccuracy-causes-and-labor-effects-chuang-howard-hao-chun/10011434242); [search summary](https://law-journals-books.vlex.com/vid/inventory-record-inaccuracy-dynamics-855601013)
- Kang & Gershwin (IIE Transactions, 2005): theft, misplacement, spoilage and transaction errors reduce true stock without changing the record. Small accumulated losses disrupt automatic replenishment and cause severe out-of-stocks. A later review summarises this as 1–3% inaccuracy leading to severe stock-outs. The paper also says the problem can sometimes be treated without auto-ID technology. — [MIT DSpace](https://dspace.mit.edu/handle/1721.1/36193); [lecture PDF](https://dspace.mit.edu/bitstream/handle/1721.1/74618/2-854-fall-2004/contents/lecture-notes/kang_gershwin_04.pdf)
- Tompkins Supply Chain Consortium survey: companies with a cycle-counting program average 98% inventory accuracy. This is a survey average, not a before/after comparison. — [SCXchange](https://www.thescxchange.com/articles/616-study-documents-benefits-of-cycle-counting)
- Gap Inc. combined physical and cycle counts and reported a 50% reduction in inventory inaccuracies. This is a vendor blog citation and a combined method. — [Cleverence blog](https://www.cleverence.com/amp/articles/business-blogs/stock-accuracy-cycle-count-4739/)
- Blind counting: practitioner sources say counters who see the expected quantity tend to record it. Double-blind counting uses two independent counters plus a third adjudication count when they differ beyond a tolerance. No controlled study was found. — [Racklify (double-blind)](https://racklify.com/encyclopedia/methodology-tagging-scanning-and-double-blind-counts/); [Uphance](https://uphance.com/blog/blind-inventory-counting/)
- Blind receiving trades dock speed for first-pass accuracy. Practitioners recommend using it selectively for high-risk suppliers or products. — [Racklify](https://racklify.com/encyclopedia/blind-receiving-versus-standard-receiving-pros-cons-and-when-to-use-each/)
- Cycle counting can also be driven from the WMS. Infor WMS RF-directed cycle counts support location, check-digit, or no verification per zone. — [Infor WMS docs 2026.x](https://docs.infor.com/wms/2026.x/en-us/useradminlib/sceinmgtug/gcw1612893750545.html)

### Inferences
- The strongest evidence is for counting more often and targeting the counts, not for any single named variant. Targeting by category and by risk factors fits the evidence: high-stock, frequently restocked, perishable, non-promoted SKUs, and SKUs where the system shows more than the shelf (DeHoratius/Raman variance split; Rekik 2025).
- For a store with phones, the natural design is micro-counts of 5–20 SKUs per day. Candidates would come from (a) risk scores, (b) exceptions such as zero sales with stock, negative stock or pick-shorts, and (c) zero/low-stock moments, when counting is cheapest. The counts should be blind: the app does not reveal the system quantity until after the count. This is my synthesis, not a tested study.
- Precision to a few units: a scanned, blind count of one SKU at one location can be exact (counted units). The weak points are a hidden second location (backroom, display) and the human counting error itself.

### Gaps
- No peer-reviewed effect size was found for blind vs non-blind counting, for opportunity-based counting, or for ABC vs random cycle counts in retail stores.
- No source was found for labour time per SKU counted with a phone versus a full stocktake.

## 2. Reconciliation methods (three-way match, order/pick/pack/ship, returns, POS vs stock, pick-short, negative stock)

### Takeaway
Reconciliation methods are standard practice in WMS and ERP systems, but I found little quantified evidence on how well they detect shrink. Their main value is localisation: each handover point (receipt, move, sale, return) that is reconciled narrows down where and when a unit disappeared. Industry data says about 27% of shrink comes from process and control failures, the kind of loss reconciliation can catch.

### Cited Findings
- NRF National Retail Security Survey 2023 (2022 data): external theft 36.15%, internal theft 28.85%, process and control failures and errors 27.29%, unknown 5.88%, other 1.32%. The average shrink rate was 1.6% of sales. The survey covered 177 retail brands. Process failures include administrative errors, breakage and vendor fraud. — [Retail Dive 2023](https://www.retaildive.com/news/retail-shrink-theft-changed-little-in-2022-nrf/694844/); [CNBC 2023](https://www.cnbc.com/2023/09/26/organized-retail-crime-and-theft-not-increasing-much-nrf-study-finds.html)
- NRF retracted its earlier claim that about half of shrink came from organised retail crime. That figure traced back to 2016 data. — [Digital Commerce 360, Dec 2023](https://www.digitalcommerce360.com/2023/12/04/nrf-retracts-statement-financial-impact-organized-retail-crime/)
- Beck's Total Retail Loss framework (2016, with RILA and ECR) moves beyond the "four buckets" and recommends process mapping and Failure Mode Effect Analysis to find operational loss points. TRL 2.0 identified 42 loss categories. — [Loss Prevention Media](https://losspreventionmedia.com/beyond-shrinkage/); [ECR paper page](https://ecr-group.netlify.app/research/beyond-shrinkage-introducing-total-retail-loss-first-paper); [ASIS Security Management 2017](https://www.asisonline.org/security-management-magazine/articles/2017/04/redefining-loss/)
- VoiceLink supports a "count mismatch" feature in voice workflows, which needs custom configuration for cycle counting. This is an example of reconciliation built into a directed task. — [Honeywell VoiceLink 4.2.1 release notes](https://help.honeywellaidc.com/Content/VoiceLink%20Release%20Notes/Vocollect_VoiceLink_421_ReleaseNotes.pdf)

### Inferences
- These ideas are my own synthesis of how practice works; I found no numeric evidence for them.
  - **Three-way matching** (purchase order vs supplier dispatch note/ASN vs scanned goods receipt): a blind receipt scan catches supplier short-shipments and receiving errors at the door, before the goods enter "store stock".
  - **Pick-short events** (a picker or shelf filler finds less than expected) are a free, timestamped signal that the record is wrong at that location. They should trigger an immediate count of that location.
  - **Negative stock** proves a missing or duplicated transaction, such as an unregistered receipt or a sale on the wrong EAN or size variant. It points to process error, not theft.
  - **POS vs stock:** sales without matching stock movements, and returns without a receipt or an original sale, are the bridge to exception-based reporting (section 4).
- For "where, when and which step": if the stock is counted correctly at two points in time, the loss can be placed in the interval between them. Logging every handover with a scan pins that interval to a step and a person. This is the main argument for event logging over periodic photos.

### Gaps
- No quantified study was found on the detection rate of three-way matching, returns reconciliation, or pick-short-triggered counts in retail stores.
- No ECR figure was found for the share of shrink that is "unknown" because no step was logged.

## 3. Phantom inventory / inventory record inaccuracy detection from transaction data

### Takeaway
Algorithms can flag likely phantom inventory (system shows stock, shelf is empty) from POS data alone. Examples are runs of zero sales judged against expected demand, and hidden Markov models. Reported detection is useful but imperfect: about 63% detection power with about 16% false alerts in one published model. Sending people to count the flagged SKUs has produced sales lifts in field experiments.

### Cited Findings
- Tripathy (MIT thesis, 2019): a Bayesian method using consecutive zero-sales days while the on-hand record stays positive. Daily demand is modelled as negative binomial, giving a posterior probability of phantom inventory. Estimated prevalence was 11.63% on one CPG manufacturer's POS and on-hand data. No precision or recall was reported. — [MIT DSpace 1721.1/122257](https://dspace.mit.edu/handle/1721.1/122257)
- Montoya & Gonzalez (M&SOM 2019): a hidden Markov model on POS data to detect out-of-stocks. It reports 63.48% detection power and 15.52% false alerts. These numbers come from a search-result summary because the PDF could not be parsed; verify them in the paper. — [Montoya & Gonzalez PDF](https://www.dii.uchile.cl/~rmontoya/papers/OOS_HMM_MontoyaGonzalezMSOM2019.pdf)
- Chuang, Oliva & Liu (POM 2016): a field experiment at a national retailer. Transaction data flagged likely empty shelves and record errors, and auditors were sent to fix them. Treated SKUs were less likely to have shelf out-of-stocks and record inaccuracies, sales rose, and steady-state program cost was a small fraction of the benefit. The exact percentage was not in the abstract. — [RePEc](https://econpapers.repec.org/RePEc:bla:popmgt:v:25:y:2016:i:5:p:935-951); [NCCU repository](https://nccur.lib.nccu.edu.tw/handle/140.119/81087)
- DeHoratius, Mersereau & Schrage, "Retail Inventory Management When Records Are Inaccurate" (M&SOM 10(2), 2008), proposes treating inventory as a probability distribution updated with sales (Bayesian inventory record) instead of a single number. I could not access the full text, so no detection numbers are available. — [INFORMS reference page](https://pubsonline.informs.org/doi/references/10.1287/msom.1070.0203)
- Chen (POM 2021) models phantom stockouts as caused by unobserved shrinkage and treats shelf inspection as a Bayesian dynamic program, deciding when to send someone to check. — [IDEAS/RePEc](https://ideas.repec.org/a/bla/popmgt/v30y2021i3p689-702.html)
- An unverified conference listing (2026) claims an unsupervised "ghost stockout" detector with a true positive rate of 35% in the top department-store pairs. No paper was found, so treat it with caution. — [devsummit2026 listing](https://devsummit2026.sched.com/event/c62c12fd2f438f546b0559cf06f01dbc)
- Context: the global average FMCG out-of-stock rate was about 8% (Gruen, Corsten & Bharadwaj, 2002; 52 studies, 29 countries). Store-level causes dominate, and consumers react by switching store (31%), substituting the same brand (19%), delaying (15%) or not buying (9%). — [Supermarket News](https://www.supermarketnews.com/archive/new-study-aims-fix-persistent-stockouts); [OSA literature review, CORE](https://core.ac.uk/download/72840065.pdf); [Wikipedia: Stockout](https://en.wikipedia.com/wiki/Stockout)

### Inferences
- A simple, buildable version: for each SKU and location, compute P(0 sales in k days | system stock > 0, expected daily demand λ) = e^(−λk) (Poisson) or the negative binomial equivalent. When this falls below a threshold such as 1–5%, put the SKU in the voice agent's count queue. This is a standard detector; the threshold would need tuning on the team's own data.
- The detector only works for SKUs that normally sell. Slow movers produce long zero-sales runs by chance, which is why the cited methods model demand variance.
- It answers "which SKU is probably wrong, and roughly since when" (the run starts at the last sale). It does not answer "which step lost it". That needs the reconciliation and event log from section 2.

### Gaps
- No precision or recall was found for the DeHoratius/Mersereau/Schrage or Tripathy methods.
- No exact sales-lift percentage was found for Chuang, Oliva & Liu (2016); the full text is paywalled.

## 4. Statistical anomaly detection on transaction logs and exception-based reporting (EBR)

### Takeaway
EBR is the established loss-prevention method. It mines POS and transaction logs for outliers by employee, register, shift or store: excess voids, refunds, no-receipt returns, price overrides, discounts and no-sales, then has someone investigate. Independent effectiveness numbers are scarce; the published figures are vendor claims.

### Cited Findings
- EBR automatically analyses POS data and flags activity outside normal patterns, such as voids, refunds, discounts and price overrides, so investigators can focus on those transactions. — [DTiQ guide to EBR](https://www.dtiq.com/resources/guide-to-exception-based-reporting); [Agilence](https://agilenceinc.com/exception-based-reporting)
- Typical red flags: a series of voids at one register, excessive refunds approved by one manager, returns without receipts, manual price overrides and frequent no-sales. — [Spot AI EBR guide](https://spot.ai/blog/exception-based-reporting); [Envysion c-store EBR, 2025](https://envysion.com/industries/convenience-store-industries/maximizing-your-c-stores-exception-reports-to-mitigate-loss/)
- A practical limit: many managers do not have time to review daily POS exception reports, so alert overload is a known failure mode. — [Envysion](https://envysion.com/?p=39862); [Spot AI](https://spot.ai/blog/exception-based-reporting)
- A vendor claims a 75% reduction in employee theft with video-verified EBR. Another vendor claim says only 10.9% of employee-theft losses are recovered through apprehension. Both are unverified vendor statistics. — [Spot AI cash-register theft](https://www.spot.ai/blog/cash-register-theft)
- Internal theft was 28.85% of US shrink in 2022 (NRF), so employee-level analytics address roughly a quarter to a third of losses. — [Retail Dive 2023](https://www.retaildive.com/news/retail-shrink-theft-changed-little-in-2022-nrf/694844/)

### Inferences
- A buildable SME version: per employee, shift and location, compute rates such as refunds, voids, discounts, adjustments, count corrections and pick-shorts per 100 transactions. Flag z-scores above about 3 against peers. Show the result as a ranked list, not as an accusation.
- The same method applies to inventory adjustments: who makes write-offs or count corrections, how often, and in which category. That points to which step and which shift.
- Benford-type tests are used in accounting fraud on amounts. For small-store count data the sample sizes are probably too small to be reliable. I found no source supporting Benford tests for inventory counts.
- Privacy and labour law (Norway: Arbeidsmiljøloven, GDPR) restricts per-employee monitoring. I did not research this.

### Gaps
- No peer-reviewed evaluation was found of EBR precision (true theft cases per alert).
- No source was found applying Benford's law to retail inventory adjustments.

## 5. Voice-directed warehousing: pick-by-voice, count-by-voice, check digits

### Takeaway
Voice picking with spoken check digits is a mature method. Vendor case studies report error reductions of 25–93% and productivity gains of 15–30%. One peer-reviewed study (de Vries, de Koster & Stam 2016) found pick-by-voice performs better than RF-terminal picking. Check digits are a cheap, speakable way to prove the worker is at the right location. Voice cycle counting exists as a standard workflow in Honeywell VoiceLink.

### Cited Findings
- de Vries, de Koster & Stam (2016) compared pick-by-voice, RF terminal and pick-to-light. Pick-by-voice performed better than RF-terminal picking, and picker personality traits and age significantly affected performance. — [RePEc](https://econpapers.repec.org/RePEc:taf:tprsxx:v:54:y:2016:i:8:p:2260-2274)
- An MDPI review (2020) cites a study in which voice picking was significantly more productive than RF terminals and produced on average 21.4% fewer errors. The underlying study is not named in the excerpt. — [MDPI Applied Sciences 10(24):8777](https://mdpi.com/2076-3417/10/24/8777)
- Jordano's (Honeywell Vocollect, vendor case): errors fell 93%, from about 1 per 1,000 cases to 1 per 14,000 (99.995% accuracy). Productivity rose 19%, from 135 to 160 cases per hour, and training time fell 50%. — [MMH](https://www.mmh.com/article/voice_accuracy_reaches_99.995_following_voice_implementation)
- LifeWay (Vitech/Vocollect, vendor case, 2018): accuracy was 91.17% on paper picking. The line pick error rate fell from 1.29% to 0.39% in the first year. — [Vitech LifeWay PDF](https://scg-mmh.s3.amazonaws.com/pdfs/vitech_wp_lifeway_case_study_082118.pdf)
- eBay Enterprise: order-picking error rates fell 25%, including among temporary workers. — [Inbound Logistics](https://www.inboundlogistics.com/articles/on-your-mark-headset-go/)
- Sony of Canada (vendor case): 30% throughput gain and 15% accuracy improvement. Nisa (Körber, vendor case): 99.96% accuracy and about 14% lower error rate. — [casestudies.com Sony](https://www.casestudies.com/company/honeywell/case-study/sony-of-canada-customer-case-study); [casestudies.com Nisa](https://www.casestudies.com/company/korber-ag/case-study/korber-implement-voice-at-nisa-and-boost-operations)
- Vendor-guide ranges (indicative only): RF scanning 99.3–99.5% accuracy, voice 99.7–99.97%, pick-to-light 99.5–99.7%. — [Cleverence](https://www.cleverence.com/articles/3pl-business/pick-to-light-vs-voice-picking-vs-rf-scanning-best-system-4829)
- In Honeywell VoiceLink, operators confirm locations by speaking a check digit or a product verification code into the headset. — [Honeywell GWS VoiceLink Plug-In](https://help.honeywellaidc.com/Software/GWS_App/Content/PDF/ProductDescription/GWS_VoiceLink_Plug-In_Product_Description.pdf)
- Vocollect patent US 8,868,519 covers generating and updating location check digits so they are unique among adjacent locations. It notes that operators memorise check digits and may say them before reaching the location, which defeats verification. The patent's remedy is to rotate the digits. — [Justia patent 8868519](https://patents.justia.com/patent/8868519)
- VoiceLink 4.2.1 lists cycle counting as a voice workflow and a "count mismatch" feature (a recount prompt), which needs custom configuration for cycle counting. — [Honeywell release notes](https://help.honeywellaidc.com/Content/VoiceLink%20Release%20Notes/Vocollect_VoiceLink_421_ReleaseNotes.pdf)

### Inferences
- In a store, a voice agent can run a blind micro-count: "Go to shelf B4, read the check code" → "Scan the item" → "How many do you count?" → if the count does not match the record, "Please count again". This copies the VoiceLink mismatch pattern. The team can do this with an EAN scan for product identity plus speech for quantity, keeping hands free for handling folded garments and size variants. This is my design proposal.
- In stores, check digits can be printed shelf-label codes or random 2–3 digit codes. The patent warns that codes become memorised, so they should be rotated or replaced by a scan of the shelf label.
- Most voice evidence is from distribution centres and vendors. It shows voice is accurate and fast for directed tasks. It does not prove that voice alone improves store shrink detection.

### Gaps
- No independent study was found on voice-directed cycle counting accuracy, as opposed to picking.
- No study was found on voice use in front-of-store settings with customers present (noise, social acceptability).

## 6. Barcode-scan counting with phones vs manual vs vision (camera) counting

### Takeaway
Barcode scanning is orders of magnitude more accurate at identifying an item than typing, and it settles size and colour variants because each has its own EAN. Vision models struggle with densely packed, identical items. The benchmark dataset for dense shelves reaches only about 0.41 mAP. I found no head-to-head study of scan counting versus image counting on retail shelves.

### Cited Findings
- The widely cited Datalogic comparison gives 1 error per 300 keystrokes for keyboard entry, versus about 1 per 3 million for barcodes. This is vendor and industry material assuming ideal print and scan conditions. — [Wasp Barcode](https://waspbarcode.com/buzz/why-barcodes-almost-never-fail); [Advanced Automation](https://www.advanced-automationinc.com/learning-center/10-causes-of-warehouse-barcode-data-errors-and-what-theyre-actually-costing-your-operation/)
- A clinical laboratory study found real-world barcode error rates more than 10–15 times higher than the accepted estimates (Clinical Chemistry podcast, 2010). — [ADLM Clinical Chemistry podcast](https://myadlm.org/science-and-research/clinical-chemistry/clinical-chemistry-podcasts/2010/patient-misidentifications-caused-by-errors-in-standard-bar-code-technology)
- SKU-110K (Goldman et al., CVPR 2019): about 11,743 shelf images averaging about 147 products per image. Identical, adjacent objects are a main difficulty, and standard detectors produce incorrect and overlapping detections. — [CVPR 2019 paper](https://openaccess.thecvf.com/content_CVPR_2019/papers/Goldman_Precise_Detection_in_Densely_Packed_Scenes_CVPR_2019_paper.pdf); [Ultralytics docs](https://docs.ultralytics.com/datasets/detect/sku-110k)
- Recent semi-supervised methods report mAP of about 0.413 on SKU-110K (2025). Box-level detection quality on dense shelves therefore remains modest. — [arXiv 2509.09750](https://arxiv.org/pdf/2509.09750)

### Inferences
- mAP is not counting error, so the 0.41 figure does not translate directly into a "±N units" figure. Still, it supports the team's experience that dense, stacked, folded and occluded items are hard to count from images. Size variants are almost invisible in images, while an EAN encodes them exactly.
- Scanning each unit is exact for identity, but slow for large quantities. A practical hybrid: scan one unit to identify the SKU and variant, then speak or type the quantity, with scan-per-unit only on mismatch or recount.

### Gaps
- No peer-reviewed study was found comparing phone or handheld EAN scan counting with camera or vision shelf counting on the same shelves (units error, time per SKU).
- No published counting-error figures (MAE in units) were found for stacked or folded apparel.

## 7. How each method meets the three criteria (few-unit precision; where/when/which step; busy-store fit)

### Takeaway
No single non-camera method meets all three criteria. Blind scan-plus-voice counts give few-unit precision. Event logging and reconciliation at each handover explain where, when and in which step. Transaction analytics (zero-sales detection, EBR, negative stock, pick-shorts) decide what to count, so staff time in a busy store goes to a few high-probability SKUs.

### Cited Findings
- Frequent, targeted counting fixes records and lifts sales: 3.83–8.38% (ECR 2019) and 11% (Rekik et al. 2025). — [Internet Retailing 2019](https://internetretailing.net/?p=38723); [arXiv 2506.05357](https://arxiv.org/abs/2506.05357)
- Transaction-data-triggered audits are economically viable: steady-state cost is a small fraction of the benefit (Chuang, Oliva & Liu 2016). — [RePEc](https://econpapers.repec.org/RePEc:bla:popmgt:v:25:y:2016:i:5:p:935-951)
- POS-based out-of-stock detection reaches about 63% detection power with about 16% false alerts (Montoya & Gonzalez 2019; figure via search summary). — [PDF](https://www.dii.uchile.cl/~rmontoya/papers/OOS_HMM_MontoyaGonzalezMSOM2019.pdf)
- About 27% of shrink is process and control failures, which reconciliation can localise to a step. About 29% is internal theft, which EBR targets. About 36% is external theft, which is hard to localise without cameras (NRF 2023). — [Retail Dive 2023](https://www.retaildive.com/news/retail-shrink-theft-changed-little-in-2022-nrf/694844/)

### Inferences
My own assessment, comparing the methods against the team's criteria:

| Method | Few-unit precision | Where/when/which step | Busy-store fit (phones/scanners, customers present) |
|---|---|---|---|
| Blind cycle count (scan EAN + voice quantity) | High (exact per SKU/location, if all locations are counted) | When: brackets the interval since the last count | Good: short tasks of a few minutes, hands free |
| Exception-triggered count (pick-short, negative stock, zero-sales) | High, once counted | When: the event timestamp gives the time | Very good: only a few SKUs per day |
| Zero-sales / Bayesian phantom detection | None by itself (probabilistic) | Which SKU, and roughly since when | Very good: back-office only |
| Three-way match / blind receiving | High at receipt | Which step: supplier vs receiving | Good: back room |
| Pick/move/return scan log reconciliation | High per event | Which step and which person | Needs discipline: every move scanned |
| EBR / z-scores per employee, shift or register | None (a signal, not a count) | Who and which shift | Very good: no store labour, but privacy rules apply |
| Voice check-digit verification | Reduces wrong-location errors | Proves where the count was done | Good, but codes get memorised (patent) |
| Annual full stocktake | High once a year | Poor: a 12-month window | Poor: store closure or night work |

- Suggested product framing: "Signals decide what to count → the voice agent directs a blind scan count → a mismatch triggers a recount and a step-by-step trace through the event log".

### Gaps
- No study was found that quantifies all three criteria for any method. The table is a synthesis.
- No study was found on customer-facing disruption from in-aisle counting with voice headsets or phones.
