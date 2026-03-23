/**
 * Transaction AI Services — Heuristic analysis classes.
 * Extracted from useTransactions.js to keep the hook lean.
 * These are opt-in; useTransactions defaults to enableAI: false.
 */

// ── AI Engine ─────────────────────────────────────────────────────────────────

export class TransactionAIEngine {
  static fraudDetectionThresholds = {
    highAmount: 1000,
    rapidTransactions: 5,
    unusualTime: { start: 22, end: 6 },
    velocityCheck: 10
  };

  static async analyzeTransaction(transaction, userContext = {}) {
    const analysis = {
      riskScore: 0,
      fraudProbability: 0,
      anomalyFlags: [],
      recommendations: [],
      insights: [],
      categoryConfidence: 0,
      duplicateRisk: 0
    };

    const amount = Math.abs(parseFloat(transaction.amount));
    const timestamp = new Date(transaction.created_at || new Date());

    const amountAnalysis = this.analyzeAmount(amount, userContext);
    analysis.riskScore += amountAnalysis.riskScore;
    analysis.insights.push(...amountAnalysis.insights);

    const timeAnalysis = this.analyzeTime(timestamp, userContext);
    analysis.riskScore += timeAnalysis.riskScore;
    if (timeAnalysis.isUnusual) analysis.anomalyFlags.push('unusual_time');

    const frequencyAnalysis = this.analyzeFrequency(transaction, userContext);
    analysis.riskScore += frequencyAnalysis.riskScore;
    if (frequencyAnalysis.isRapid) {
      analysis.anomalyFlags.push('rapid_transactions');
      analysis.fraudProbability += 0.3;
    }

    const duplicateAnalysis = this.analyzeDuplicates(transaction, userContext);
    analysis.duplicateRisk = duplicateAnalysis.probability;
    if (duplicateAnalysis.probability > 0.7) analysis.anomalyFlags.push('potential_duplicate');

    analysis.categoryConfidence = this.analyzeCategoryConfidence(transaction);
    analysis.recommendations = this.generateRecommendations(analysis, transaction);
    analysis.fraudProbability = Math.min(
      (analysis.riskScore / 100) + (analysis.anomalyFlags.length * 0.15) + (analysis.duplicateRisk * 0.2),
      1.0
    );

    return analysis;
  }

  static analyzeAmount(amount, userContext) {
    const analysis = { riskScore: 0, insights: [] };
    const avgAmount = userContext.averageAmount || 50;
    const stdDev = userContext.standardDeviation || 25;
    const zScore = Math.abs((amount - avgAmount) / Math.max(stdDev, 1));

    if (zScore > 3) {
      analysis.riskScore += 30;
      analysis.insights.push({ type: 'warning', title: 'Unusual Amount', description: `This amount is ${zScore.toFixed(1)} standard deviations from your average` });
    } else if (zScore > 2) {
      analysis.riskScore += 15;
      analysis.insights.push({ type: 'info', title: 'Above Average Amount', description: 'This transaction is significantly higher than your typical spending' });
    }
    if (amount > this.fraudDetectionThresholds.highAmount) {
      analysis.riskScore += 25;
      analysis.insights.push({ type: 'warning', title: 'Large Transaction', description: 'Consider verifying this large transaction' });
    }
    if (amount < 1 && amount > 0) {
      analysis.riskScore += 10;
      analysis.insights.push({ type: 'info', title: 'Micro Transaction', description: 'Very small amounts might indicate testing or fees' });
    }
    return analysis;
  }

  static analyzeTime(timestamp, userContext) {
    const hour = timestamp.getHours();
    const dayOfWeek = timestamp.getDay();
    const analysis = { riskScore: 0, isUnusual: false };
    if (hour >= this.fraudDetectionThresholds.unusualTime.start || hour <= this.fraudDetectionThresholds.unusualTime.end) {
      analysis.riskScore += 15;
      analysis.isUnusual = true;
    }
    if (userContext.weekendSpendingRatio && (dayOfWeek === 0 || dayOfWeek === 6)) {
      if (userContext.weekendSpendingRatio < 0.2) analysis.riskScore += 10;
    }
    return analysis;
  }

  static analyzeFrequency(transaction, userContext) {
    const analysis = { riskScore: 0, isRapid: false };
    const recentCount = userContext.recentTransactionCount || 0;
    const timeWindow = userContext.recentTimeWindow || 60;
    if (recentCount >= this.fraudDetectionThresholds.rapidTransactions) {
      analysis.riskScore += 40;
      analysis.isRapid = true;
    }
    const hourlyRate = (recentCount / timeWindow) * 60;
    if (hourlyRate > this.fraudDetectionThresholds.velocityCheck) analysis.riskScore += 30;
    return analysis;
  }

  static analyzeDuplicates(transaction, userContext) {
    const recentTransactions = userContext.recentTransactions || [];
    let probability = 0;
    const amount = Math.abs(parseFloat(transaction.amount));
    const description = transaction.description?.toLowerCase() || '';
    const merchant = transaction.merchant_name?.toLowerCase() || '';

    for (const recent of recentTransactions) {
      const recentAmount = Math.abs(parseFloat(recent.amount));
      const timeDiff = new Date(transaction.created_at) - new Date(recent.created_at);
      if (timeDiff > 24 * 60 * 60 * 1000) continue;
      let similarity = 0;
      if (Math.abs(amount - recentAmount) < 0.01) similarity += 0.4;
      if (description && recent.description) similarity += this.calculateStringSimilarity(description, recent.description.toLowerCase()) * 0.3;
      if (merchant && recent.merchant_name) similarity += this.calculateStringSimilarity(merchant, recent.merchant_name.toLowerCase()) * 0.3;
      probability = Math.max(probability, similarity);
    }
    return { probability };
  }

  static calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    if (longer.length === 0) return 1.0;
    return (longer.length - this.levenshteinDistance(longer, shorter)) / longer.length;
  }

  static levenshteinDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) matrix[i] = [i];
    for (let j = 0; j <= str1.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        matrix[i][j] = str2.charAt(i - 1) === str1.charAt(j - 1)
          ? matrix[i - 1][j - 1]
          : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
    return matrix[str2.length][str1.length];
  }

  static analyzeCategoryConfidence(transaction) {
    if (!transaction.description) return 0;
    const keywords = {
      food: ['restaurant', 'food', 'grocery', 'cafe', 'eat'],
      transport: ['gas', 'uber', 'taxi', 'parking', 'fuel'],
      shopping: ['amazon', 'store', 'shop', 'mall'],
      utilities: ['electric', 'water', 'internet', 'phone']
    };
    const description = transaction.description.toLowerCase();
    let maxConfidence = 0;
    for (const categoryKeywords of Object.values(keywords)) {
      const matches = categoryKeywords.filter(kw => description.includes(kw));
      maxConfidence = Math.max(maxConfidence, matches.length / categoryKeywords.length);
    }
    return Math.round(maxConfidence * 100);
  }

  static generateRecommendations(analysis, transaction) {
    const recommendations = [];
    if (analysis.fraudProbability > 0.7) recommendations.push({ type: 'security', priority: 'high', title: 'Review Transaction', description: 'This transaction has been flagged for potential fraud', actions: ['verify', 'report', 'block'] });
    if (analysis.duplicateRisk > 0.8) recommendations.push({ type: 'duplicate', priority: 'medium', title: 'Potential Duplicate', description: 'This transaction appears similar to a recent one', actions: ['compare', 'mark_unique', 'merge'] });
    if (analysis.categoryConfidence === 0 && !transaction.category_id) recommendations.push({ type: 'categorization', priority: 'low', title: 'Add Category', description: 'Categorizing helps with budgeting and insights', actions: ['auto_categorize', 'manual_select'] });
    if (analysis.riskScore > 50) recommendations.push({ type: 'verification', priority: 'medium', title: 'Verify Details', description: 'Consider adding receipt or additional notes', actions: ['add_receipt', 'add_notes', 'verify_amount'] });
    return recommendations;
  }

  static async getBatchInsights(transactions, userContext) {
    const insights = { totalAnalyzed: transactions.length, highRiskCount: 0, potentialDuplicates: 0, uncategorized: 0, averageRisk: 0, fraudAlerts: [], patterns: {}, recommendations: [] };
    let totalRisk = 0;
    for (const transaction of transactions) {
      const analysis = await this.analyzeTransaction(transaction, userContext);
      totalRisk += analysis.riskScore;
      if (analysis.fraudProbability > 0.7) { insights.highRiskCount++; insights.fraudAlerts.push({ transactionId: transaction.id, probability: analysis.fraudProbability, flags: analysis.anomalyFlags }); }
      if (analysis.duplicateRisk > 0.8) insights.potentialDuplicates++;
      if (!transaction.category_id) insights.uncategorized++;
    }
    insights.averageRisk = totalRisk / transactions.length;
    if (insights.highRiskCount > 0) insights.recommendations.push({ type: 'security_review', title: 'Security Review Needed', description: `${insights.highRiskCount} transactions flagged for review`, priority: 'high' });
    if (insights.uncategorized > transactions.length * 0.3) insights.recommendations.push({ type: 'categorization', title: 'Improve Categorization', description: `${insights.uncategorized} transactions need categories`, priority: 'medium' });
    return insights;
  }
}

// ── Spending Analytics ────────────────────────────────────────────────────────

export class TransactionAnalytics {
  static generateSpendingInsights(transactions) {
    const hourlySpending = {}, dailySpending = {}, monthlySpending = {};
    transactions.forEach(transaction => {
      const date = new Date(transaction.created_at);
      const amount = Math.abs(parseFloat(transaction.amount));
      hourlySpending[date.getHours()] = (hourlySpending[date.getHours()] || 0) + amount;
      dailySpending[date.getDay()] = (dailySpending[date.getDay()] || 0) + amount;
      monthlySpending[date.getMonth()] = (monthlySpending[date.getMonth()] || 0) + amount;
    });

    const patterns = {
      peakHour: this.findPeak(hourlySpending),
      peakDay: this.findPeak(dailySpending),
      peakMonth: this.findPeak(monthlySpending),
      spendingDistribution: this.calculateDistribution(transactions)
    };
    const trends = this.calculateTrends(transactions);
    const predictions = this.generatePredictions(trends);
    return { patterns, trends, predictions, recommendations: this.generateSmartRecommendations({ patterns, trends, predictions }) };
  }

  static findPeak(data) {
    return Object.entries(data).reduce((max, [key, value]) => value > max.value ? { key: parseInt(key), value } : max, { key: 0, value: 0 });
  }

  static calculateDistribution(transactions) {
    const ranges = { micro: 0, small: 0, medium: 0, large: 0, huge: 0 };
    transactions.forEach(t => {
      const amount = Math.abs(parseFloat(t.amount));
      if (amount < 10) ranges.micro++;
      else if (amount < 50) ranges.small++;
      else if (amount < 200) ranges.medium++;
      else if (amount < 1000) ranges.large++;
      else ranges.huge++;
    });
    return ranges;
  }

  static calculateTrends(transactions) {
    const monthly = {};
    transactions.forEach(t => {
      const monthKey = new Date(t.created_at).toISOString().substring(0, 7);
      if (!monthly[monthKey]) monthly[monthKey] = { total: 0, count: 0 };
      monthly[monthKey].total += Math.abs(parseFloat(t.amount));
      monthly[monthKey].count++;
    });
    const values = Object.keys(monthly).sort().map(k => monthly[k].total);
    return {
      direction: values.length > 1 ? (values.at(-1) > values[0] ? 'increasing' : 'decreasing') : 'stable',
      slope: this.calculateSlope(values),
      volatility: this.calculateVolatility(values),
      growth: values.length > 1 ? ((values.at(-1) - values[0]) / values[0]) * 100 : 0
    };
  }

  static calculateSlope(values) {
    if (values.length < 2) return 0;
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumXX = values.reduce((sum, _, x) => sum + x * x, 0);
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  static calculateVolatility(values) {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance) / mean;
  }

  static generatePredictions(trends) {
    return {
      nextMonthSpending: trends.slope > 0 ? 'increase' : trends.slope < 0 ? 'decrease' : 'stable',
      confidence: Math.max(0, 1 - trends.volatility),
      riskLevel: trends.volatility > 0.3 ? 'high' : trends.volatility > 0.15 ? 'medium' : 'low'
    };
  }

  static generateSmartRecommendations(insights) {
    const recommendations = [];
    if (insights.predictions.riskLevel === 'high') recommendations.push({ type: 'budgeting', title: 'Budget Volatility Warning', description: 'Your spending shows high volatility. Consider setting stricter budgets.', priority: 'high' });
    if (insights.trends.direction === 'increasing' && insights.trends.growth > 20) recommendations.push({ type: 'spending_alert', title: 'Spending Increase Detected', description: `Your spending has increased by ${insights.trends.growth.toFixed(1)}%`, priority: 'medium' });
    if (insights.patterns.spendingDistribution?.huge > insights.patterns.spendingDistribution?.small) recommendations.push({ type: 'large_purchases', title: 'Large Purchase Pattern', description: 'You tend to make large purchases. Consider planning these in advance.', priority: 'low' });
    return recommendations;
  }
}

// ── Cache Manager ─────────────────────────────────────────────────────────────

export class TransactionCacheManager {
  static cache = new Map();
  static TTL = 3 * 60 * 1000;
  static maxSize = 500;

  static generateKey(type, params = {}) {
    return `${type}:${Object.entries(params).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}:${v}`).join('|')}`;
  }

  static get(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.TTL) return cached.data;
    this.cache.delete(key);
    return null;
  }

  static set(key, data) {
    if (this.cache.size >= this.maxSize) this.cache.delete(this.cache.keys().next().value);
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  static invalidatePattern(pattern) {
    for (const [key] of this.cache) { if (key.includes(pattern)) this.cache.delete(key); }
  }

  static clear() { this.cache.clear(); }
}

// ── Performance Monitor ───────────────────────────────────────────────────────

export class TransactionPerformanceMonitor {
  static metrics = { queries: 0, mutations: 0, cacheHits: 0, cacheMisses: 0, avgResponseTime: 0, errors: 0, aiAnalyses: 0 };

  static recordQuery(duration) { this.metrics.queries++; this.metrics.avgResponseTime = (this.metrics.avgResponseTime + duration) / 2; }
  static recordMutation() { this.metrics.mutations++; }
  static recordCacheHit() { this.metrics.cacheHits++; }
  static recordCacheMiss() { this.metrics.cacheMisses++; }
  static recordError() { this.metrics.errors++; }
  static recordAIAnalysis() { this.metrics.aiAnalyses++; }

  static getMetrics() {
    return {
      ...this.metrics,
      cacheHitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) || 0,
      errorRate: this.metrics.errors / Math.max(this.metrics.queries + this.metrics.mutations, 1),
      avgResponseTime: Math.round(this.metrics.avgResponseTime * 100) / 100
    };
  }
}
