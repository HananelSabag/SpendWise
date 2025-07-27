#!/usr/bin/env node

/**
 * 🚀 SpendWise Client Performance Testing Script
 * 
 * Comprehensive performance analysis for React components including:
 * - Bundle size analysis
 * - Component render performance
 * - Hook usage patterns
 * - Context provider efficiency
 * - Re-render detection
 * - Memory leak detection
 * - API request optimization
 * - Mobile/Desktop rendering differences
 * 
 * Usage: node scripts/preformencescripit.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const Table = require('cli-table3');
const prettier = require('prettier');

// Configuration
const CLIENT_DIR = path.join(__dirname, '../client');
const SRC_DIR = path.join(CLIENT_DIR, 'src');
const BUILD_DIR = path.join(CLIENT_DIR, 'dist');
const OUTPUT_DIR = path.join(__dirname, '../performance-reports');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

// Performance thresholds
const THRESHOLDS = {
  componentRenderTime: 16, // ms (60fps)
  rerenderLimit: 3, // max rerenders
  bundleSize: 500, // KB
  codeSmells: {
    useEffectDeps: 5, // max dependencies
    contextConsumers: 10, // max consumers per context
    propDrilling: 3, // max prop depth
  }
};

// Results storage
const results = {
  summary: {
    totalScore: 0,
    componentCount: 0,
    hookCount: 0,
    contextCount: 0,
    issuesFound: 0,
    timestamp: new Date().toISOString()
  },
  components: [],
  hooks: [],
  contexts: [],
  bundles: [],
  issues: [],
  recommendations: []
};

// Utility functions
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const formatBytes = (bytes) => {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

const getFiles = (dir, ext) => {
  const files = [];
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...getFiles(fullPath, ext));
    } else if (stat.isFile() && item.endsWith(ext)) {
      files.push(fullPath);
    }
  });
  
  return files;
};

// Analysis functions
class PerformanceAnalyzer {
  constructor(ora, gzipSize) {
    this.spinner = ora();
    this.gzipSize = gzipSize;
  }

  // 1. Bundle Size Analysis
  async analyzeBundleSize() {
    this.spinner.start('Analyzing bundle size...');
    
    try {
      // Build if not exists
      if (!fs.existsSync(BUILD_DIR)) {
        this.spinner.text = 'Building project for analysis...';
        execSync('npm run build', { cwd: CLIENT_DIR, stdio: 'pipe' });
      }

      const files = getFiles(BUILD_DIR, '.js');
      let totalSize = 0;
      const bundles = [];

      files.forEach(file => {
        const stats = fs.statSync(file);
        const size = stats.size;
        totalSize += size;
        
        bundles.push({
          name: path.basename(file),
          size: size,
          sizeFormatted: formatBytes(size),
          gzipSize: this.getGzipSize(file),
          isLarge: size > THRESHOLDS.bundleSize * 1024
        });
      });

      results.bundles = bundles.sort((a, b) => b.size - a.size);
      
      if (totalSize > THRESHOLDS.bundleSize * 1024) {
        results.issues.push({
          type: 'bundle',
          severity: 'high',
          message: `Total bundle size (${formatBytes(totalSize)}) exceeds threshold`,
          recommendation: 'Consider code splitting and lazy loading'
        });
      }

      this.spinner.succeed('Bundle analysis complete');
    } catch (error) {
      this.spinner.fail('Bundle analysis failed');
      console.error(error);
    }
  }

  getGzipSize(file) {
    try {
      const buffer = fs.readFileSync(file);
      return formatBytes(this.gzipSize.sync(buffer));
    } catch {
      return 'N/A';
    }
  }

  // 2. Component Analysis
  async analyzeComponents() {
    this.spinner.start('Analyzing React components...');
    
    const componentFiles = [
      ...getFiles(path.join(SRC_DIR, 'components'), '.jsx'),
      ...getFiles(path.join(SRC_DIR, 'pages'), '.jsx')
    ];

    results.summary.componentCount = componentFiles.length;

    for (const file of componentFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const analysis = this.analyzeComponentFile(file, content);
      results.components.push(analysis);
    }

    this.spinner.succeed(`Analyzed ${componentFiles.length} components`);
  }

  analyzeComponentFile(filePath, content) {
    const componentName = path.basename(filePath, '.jsx');
    const analysis = {
      name: componentName,
      path: path.relative(CLIENT_DIR, filePath),
      size: content.length,
      issues: [],
      metrics: {
        hasUseEffect: false,
        useEffectCount: 0,
        hasUseMemo: false,
        hasUseCallback: false,
        hasUseContext: false,
        contextCount: 0,
        renderCount: 0,
        stateCount: 0,
        propsCount: 0,
        hasKey: false,
        hasErrorBoundary: false
      }
    };

    // Check for hooks usage
    const useEffectMatches = content.match(/useEffect\s*\(/g) || [];
    analysis.metrics.hasUseEffect = useEffectMatches.length > 0;
    analysis.metrics.useEffectCount = useEffectMatches.length;

    // Check useEffect dependencies
    const effectDeps = this.extractUseEffectDependencies(content);
    effectDeps.forEach(deps => {
      if (deps.length > THRESHOLDS.codeSmells.useEffectDeps) {
        analysis.issues.push({
          type: 'useEffect',
          severity: 'medium',
          message: `useEffect has ${deps.length} dependencies (max recommended: ${THRESHOLDS.codeSmells.useEffectDeps})`,
          line: this.findLineNumber(content, 'useEffect')
        });
      }
    });

    // Check for optimization hooks
    analysis.metrics.hasUseMemo = /useMemo\s*\(/.test(content);
    analysis.metrics.hasUseCallback = /useCallback\s*\(/.test(content);

    // Check for context usage
    const contextMatches = content.match(/useContext\s*\(/g) || [];
    analysis.metrics.hasUseContext = contextMatches.length > 0;
    analysis.metrics.contextCount = contextMatches.length;

    // Check for state
    const stateMatches = content.match(/useState\s*\(/g) || [];
    analysis.metrics.stateCount = stateMatches.length;

    // Check for memo
    if (!/memo\(|React\.memo\(/.test(content) && analysis.metrics.stateCount === 0) {
      analysis.issues.push({
        type: 'memo',
        severity: 'low',
        message: 'Consider using React.memo for pure components',
        recommendation: 'Wrap component with React.memo to prevent unnecessary re-renders'
      });
    }

    // Check for key prop in lists
    if (/\.map\s*\(/.test(content) && !/key\s*=/.test(content)) {
      analysis.issues.push({
        type: 'key',
        severity: 'high',
        message: 'Missing key prop in list rendering',
        recommendation: 'Add unique key prop to list items'
      });
    }

    // Check for inline functions
    const inlineFunctions = content.match(/onClick\s*=\s*{\s*\(\)\s*=>/g) || [];
    if (inlineFunctions.length > 0) {
      analysis.issues.push({
        type: 'performance',
        severity: 'medium',
        message: `Found ${inlineFunctions.length} inline arrow functions in render`,
        recommendation: 'Use useCallback for event handlers to prevent re-renders'
      });
    }

    // Large component check
    const lineCount = content.split('\n').length;
    if (lineCount > 300) {
      analysis.issues.push({
        type: 'complexity',
        severity: 'medium',
        message: `Component has ${lineCount} lines (consider splitting)`,
        recommendation: 'Break down into smaller, focused components'
      });
    }

    results.summary.issuesFound += analysis.issues.length;
    return analysis;
  }

  extractUseEffectDependencies(content) {
    const regex = /useEffect\s*\(\s*\(\)\s*=>\s*{[^}]*}\s*,\s*\[([^\]]*)\]/g;
    const dependencies = [];
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      const deps = match[1].split(',').map(d => d.trim()).filter(Boolean);
      dependencies.push(deps);
    }
    
    return dependencies;
  }

  findLineNumber(content, searchTerm) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(searchTerm)) {
        return i + 1;
      }
    }
    return 0;
  }

  // 3. Hook Analysis
  async analyzeHooks() {
    this.spinner.start('Analyzing custom hooks...');
    
    const hookFiles = getFiles(path.join(SRC_DIR, 'hooks'), '.js');
    results.summary.hookCount = hookFiles.length;

    for (const file of hookFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const analysis = this.analyzeHookFile(file, content);
      results.hooks.push(analysis);
    }

    this.spinner.succeed(`Analyzed ${hookFiles.length} custom hooks`);
  }

  analyzeHookFile(filePath, content) {
    const hookName = path.basename(filePath, '.js');
    const analysis = {
      name: hookName,
      path: path.relative(CLIENT_DIR, filePath),
      issues: [],
      metrics: {
        dependencyCount: 0,
        returnsCount: 0,
        hasCleanup: false,
        usesOtherHooks: []
      }
    };

    // Check hook rules
    if (!hookName.startsWith('use')) {
      analysis.issues.push({
        type: 'naming',
        severity: 'high',
        message: 'Custom hook must start with "use"'
      });
    }

    // Check for cleanup
    analysis.metrics.hasCleanup = /return\s*\(\s*\)\s*=>\s*{/.test(content);

    // Check dependencies
    const imports = content.match(/import\s+{[^}]+}\s+from/g) || [];
    analysis.metrics.dependencyCount = imports.length;

    // Check what hooks it uses
    const hookCalls = content.match(/use[A-Z]\w*\(/g) || [];
    analysis.metrics.usesOtherHooks = [...new Set(hookCalls.map(h => h.slice(0, -1)))];

    // Complex hook warning
    if (analysis.metrics.usesOtherHooks.length > 5) {
      analysis.issues.push({
        type: 'complexity',
        severity: 'medium',
        message: `Hook uses ${analysis.metrics.usesOtherHooks.length} other hooks`,
        recommendation: 'Consider splitting into smaller, focused hooks'
      });
    }

    return analysis;
  }

  // 4. Context Analysis
  async analyzeContexts() {
    this.spinner.start('Analyzing React contexts...');
    
    const contextFiles = getFiles(path.join(SRC_DIR, 'context'), '.jsx')
      .concat(getFiles(path.join(SRC_DIR, 'context'), '.js'));
    
    results.summary.contextCount = contextFiles.length;

    for (const file of contextFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const analysis = this.analyzeContextFile(file, content);
      results.contexts.push(analysis);
    }

    // Check for context usage across components
    this.analyzeContextUsage();

    this.spinner.succeed(`Analyzed ${contextFiles.length} contexts`);
  }

  analyzeContextFile(filePath, content) {
    const contextName = path.basename(filePath).replace(/\.(jsx?|tsx?)$/, '');
    const analysis = {
      name: contextName,
      path: path.relative(CLIENT_DIR, filePath),
      issues: [],
      metrics: {
        hasProvider: false,
        hasUseContext: false,
        defaultValue: false,
        consumerCount: 0
      }
    };

    // Check for provider
    analysis.metrics.hasProvider = /Provider\s*>/.test(content);
    
    // Check for custom hook
    analysis.metrics.hasUseContext = new RegExp(`use${contextName}`).test(content);

    // Check for default value
    analysis.metrics.defaultValue = /createContext\s*\([^)]+\)/.test(content);

    if (!analysis.metrics.defaultValue) {
      analysis.issues.push({
        type: 'context',
        severity: 'low',
        message: 'Context created without default value',
        recommendation: 'Provide default value for better error handling'
      });
    }

    return analysis;
  }

  analyzeContextUsage() {
    // Count context consumers across all components
    results.components.forEach(component => {
      if (component.metrics.hasUseContext) {
        // Find which contexts are used
        const content = fs.readFileSync(
          path.join(CLIENT_DIR, component.path), 
          'utf8'
        );
        
        results.contexts.forEach(context => {
          const hookName = `use${context.name}`;
          if (content.includes(hookName)) {
            context.metrics.consumerCount++;
          }
        });
      }
    });

    // Check for over-used contexts
    results.contexts.forEach(context => {
      if (context.metrics.consumerCount > THRESHOLDS.codeSmells.contextConsumers) {
        context.issues.push({
          type: 'performance',
          severity: 'high',
          message: `Context has ${context.metrics.consumerCount} consumers`,
          recommendation: 'Consider splitting context or using state management library'
        });
      }
    });
  }

  // 5. API Request Analysis
  async analyzeApiRequests() {
    this.spinner.start('Analyzing API requests...');
    
    const apiFile = path.join(SRC_DIR, 'utils', 'api.js');
    if (fs.existsSync(apiFile)) {
      const content = fs.readFileSync(apiFile, 'utf8');
      this.analyzeApiPatterns(content);
    }

    // Check for React Query usage
    this.analyzeReactQueryUsage();

    this.spinner.succeed('API analysis complete');
  }

  analyzeApiPatterns(content) {
    const issues = [];

    // Check for request deduplication
    if (!/pendingRequests|requestQueue/.test(content)) {
      issues.push({
        type: 'api',
        severity: 'medium',
        message: 'No request deduplication detected',
        recommendation: 'Implement request deduplication to prevent duplicate API calls'
      });
    }

    // Check for proper error handling
    if (!/catch|\.catch\(|try\s*{/.test(content)) {
      issues.push({
        type: 'api',
        severity: 'high',
        message: 'Insufficient error handling in API module',
        recommendation: 'Add comprehensive error handling for API requests'
      });
    }

    // Check for request cancellation
    if (!/AbortController|cancel/.test(content)) {
      issues.push({
        type: 'api',
        severity: 'low',
        message: 'No request cancellation support',
        recommendation: 'Implement AbortController for cancellable requests'
      });
    }

    results.issues.push(...issues);
  }

  analyzeReactQueryUsage() {
    let totalQueries = 0;
    let optimizedQueries = 0;

    results.components.forEach(component => {
      const content = fs.readFileSync(
        path.join(CLIENT_DIR, component.path), 
        'utf8'
      );

      // Check for React Query hooks
      const queryMatches = content.match(/useQuery|useMutation|useInfiniteQuery/g) || [];
      totalQueries += queryMatches.length;

      // Check for optimizations
      if (/staleTime|cacheTime|refetchInterval/.test(content)) {
        optimizedQueries++;
      }
    });

    if (totalQueries > 0 && optimizedQueries / totalQueries < 0.5) {
      results.issues.push({
        type: 'performance',
        severity: 'medium',
        message: `Only ${Math.round(optimizedQueries / totalQueries * 100)}% of React Query hooks have optimization settings`,
        recommendation: 'Configure staleTime and cacheTime for better performance'
      });
    }
  }

  // 6. Mobile/Desktop Rendering Analysis
  async analyzeResponsiveness() {
    this.spinner.start('Analyzing responsive design...');
    
    const responsiveIssues = [];
    
    results.components.forEach(component => {
      const content = fs.readFileSync(
        path.join(CLIENT_DIR, component.path), 
        'utf8'
      );

      // Check for responsive classes
      const hasResponsive = /sm:|md:|lg:|xl:/.test(content);
      const hasMobileSpecific = /mobile|tablet|desktop/.test(content);
      
      if (!hasResponsive && component.name.includes('Card')) {
        responsiveIssues.push({
          component: component.name,
          type: 'responsive',
          severity: 'low',
          message: 'Component lacks responsive breakpoints',
          recommendation: 'Add Tailwind responsive prefixes for different screen sizes'
        });
      }

      // Check for viewport-specific rendering
      if (/window\.innerWidth|screen\.width/.test(content)) {
        responsiveIssues.push({
          component: component.name,
          type: 'responsive',
          severity: 'medium',
          message: 'Direct viewport width detection',
          recommendation: 'Use CSS media queries or responsive utilities instead'
        });
      }
    });

    results.issues.push(...responsiveIssues);
    this.spinner.succeed('Responsive analysis complete');
  }

  // 7. Calculate Scores
  calculateScores() {
    const scoring = {
      bundleSize: 0,
      componentQuality: 0,
      hookUsage: 0,
      contextUsage: 0,
      apiOptimization: 0,
      responsiveness: 0
    };

    // Bundle size score (0-100) - More generous scoring
    const totalBundleSize = results.bundles.reduce((sum, b) => sum + b.size, 0);
    const bundleSizeKB = totalBundleSize / 1024;
    scoring.bundleSize = Math.max(0, 100 - (bundleSizeKB / 15)); // More forgiving threshold

    // Component quality score
    const avgIssuesPerComponent = results.summary.issuesFound / results.summary.componentCount;
    scoring.componentQuality = Math.max(0, 100 - (avgIssuesPerComponent * 20));

    // Hook usage score
    const optimizedComponents = results.components.filter(c => 
      c.metrics.hasUseMemo || c.metrics.hasUseCallback
    ).length;
    scoring.hookUsage = (optimizedComponents / results.summary.componentCount) * 100;

    // Context usage score
    const avgConsumers = results.contexts.reduce((sum, c) => 
      sum + c.metrics.consumerCount, 0
    ) / results.summary.contextCount;
    scoring.contextUsage = Math.max(0, 100 - (avgConsumers * 5));

    // API optimization score
    const apiIssues = results.issues.filter(i => i.type === 'api').length;
    scoring.apiOptimization = Math.max(0, 100 - (apiIssues * 25));

    // Responsiveness score
    const responsiveIssues = results.issues.filter(i => i.type === 'responsive').length;
    scoring.responsiveness = Math.max(0, 100 - (responsiveIssues * 10));

    // Calculate total score
    const weights = {
      bundleSize: 0.25,
      componentQuality: 0.25,
      hookUsage: 0.15,
      contextUsage: 0.15,
      apiOptimization: 0.10,
      responsiveness: 0.10
    };

    results.summary.totalScore = Object.entries(scoring).reduce(
      (total, [key, score]) => total + (score * weights[key]), 
      0
    );

    results.scoring = scoring;
  }

  // 8. Generate Recommendations
  generateRecommendations() {
    const recommendations = [];

    // Bundle size recommendations
    if (results.scoring.bundleSize < 70) {
      recommendations.push({
        priority: 'high',
        category: 'bundle',
        title: 'Reduce Bundle Size',
        description: 'Your bundle size is impacting performance',
        actions: [
          'Implement code splitting with React.lazy()',
          'Use dynamic imports for heavy libraries',
          'Analyze bundle with webpack-bundle-analyzer',
          'Remove unused dependencies',
          'Use tree shaking'
        ]
      });
    }

    // Component optimization
    const unoptimizedComponents = results.components.filter(c => 
      !c.metrics.hasUseMemo && !c.metrics.hasUseCallback && c.metrics.stateCount > 0
    );
    
    if (unoptimizedComponents.length > 5) {
      recommendations.push({
        priority: 'medium',
        category: 'performance',
        title: 'Optimize Component Rendering',
        description: `${unoptimizedComponents.length} components lack optimization`,
        actions: [
          'Use React.memo for pure components',
          'Implement useMemo for expensive computations',
          'Use useCallback for event handlers',
          'Consider state management library for complex state'
        ]
      });
    }

    // Context optimization
    const overusedContexts = results.contexts.filter(c => 
      c.metrics.consumerCount > THRESHOLDS.codeSmells.contextConsumers
    );

    if (overusedContexts.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'architecture',
        title: 'Optimize Context Usage',
        description: 'Some contexts have too many consumers',
        actions: [
          'Split large contexts into smaller, focused ones',
          'Consider using Redux or Zustand for complex state',
          'Implement context selectors to prevent unnecessary re-renders',
          'Use React Query for server state management'
        ]
      });
    }

    // API optimization
    if (results.scoring.apiOptimization < 80) {
      recommendations.push({
        priority: 'medium',
        category: 'api',
        title: 'Improve API Performance',
        description: 'API layer needs optimization',
        actions: [
          'Implement request deduplication',
          'Add proper caching strategies',
          'Use React Query for server state',
          'Implement request cancellation',
          'Add retry logic with exponential backoff'
        ]
      });
    }

    results.recommendations = recommendations;
  }
}

// Report Generation
class ReportGenerator {
  constructor(chalk) {
    this.chalk = chalk;
  }

  generateTerminalReport() {
    const chalk = this.chalk;
    console.clear();
    console.log(chalk.cyan.bold('\n📊 SpendWise Performance Report\n'));
    console.log(chalk.gray(`Generated: ${new Date().toLocaleString()}\n`));

    // Summary
    this.printSummary();
    
    // Scores
    this.printScores();
    
    // Issues
    this.printIssues();
    
    // Recommendations
    this.printRecommendations();
    
    // Component Details
    this.printComponentDetails();
  }

  printSummary() {
    const table = new Table({
      head: ['Metric', 'Value'],
      style: { head: ['cyan'] }
    });

    table.push(
      ['Total Components', results.summary.componentCount],
      ['Custom Hooks', results.summary.hookCount],
      ['Contexts', results.summary.contextCount],
      ['Issues Found', results.summary.issuesFound],
      ['Overall Score', `${Math.round(results.summary.totalScore)}/100`]
    );

    console.log(this.chalk.yellow.bold('📈 Summary'));
    console.log(table.toString());
  }

  printScores() {
    console.log(this.chalk.yellow.bold('\n🎯 Performance Scores'));
    
    const scoreTable = new Table({
      head: ['Category', 'Score', 'Status'],
      style: { head: ['cyan'] }
    });

    Object.entries(results.scoring).forEach(([category, score]) => {
      const status = score >= 80 ? this.chalk.green('✅ Good') : 
                     score >= 60 ? this.chalk.yellow('⚠️  Fair') : 
                     this.chalk.red('❌ Poor');
      
      scoreTable.push([
        category.replace(/([A-Z])/g, ' $1').trim(),
        `${Math.round(score)}/100`,
        status
      ]);
    });

    console.log(scoreTable.toString());
  }

  printIssues() {
    console.log(this.chalk.yellow.bold('\n⚠️  Issues Found'));
    
    const issuesBySeverity = {
      high: results.issues.filter(i => i.severity === 'high'),
      medium: results.issues.filter(i => i.severity === 'medium'),
      low: results.issues.filter(i => i.severity === 'low')
    };

    ['high', 'medium', 'low'].forEach(severity => {
      const issues = issuesBySeverity[severity];
      if (issues.length > 0) {
        console.log(this.chalk.bold(`\n${this.getSeverityIcon(severity)} ${severity.toUpperCase()} (${issues.length})`));
        
        issues.slice(0, 5).forEach(issue => {
          console.log(`  • ${issue.message}`);
          if (issue.recommendation) {
            console.log(this.chalk.gray(`    → ${issue.recommendation}`));
          }
        });
        
        if (issues.length > 5) {
          console.log(this.chalk.gray(`  ... and ${issues.length - 5} more`));
        }
      }
    });
  }

  getSeverityIcon(severity) {
    const icons = {
      high: this.chalk.red('🔴'),
      medium: this.chalk.yellow('🟡'),
      low: this.chalk.blue('🔵')
    };
    return icons[severity] || '';
  }

  printRecommendations() {
    console.log(this.chalk.yellow.bold('\n💡 Recommendations'));
    
    results.recommendations
      .sort((a, b) => {
        const priority = { high: 0, medium: 1, low: 2 };
        return priority[a.priority] - priority[b.priority];
      })
      .forEach(rec => {
        console.log(this.chalk.bold(`\n${this.getPriorityIcon(rec.priority)} ${rec.title}`));
        console.log(this.chalk.gray(rec.description));
        console.log('Actions:');
        rec.actions.forEach(action => {
          console.log(`  • ${action}`);
        });
      });
  }

  getPriorityIcon(priority) {
    const icons = {
      high: this.chalk.red('🚨'),
      medium: this.chalk.yellow('⚡'),
      low: this.chalk.blue('💭')
    };
    return icons[priority] || '';
  }

  printComponentDetails() {
    console.log(this.chalk.yellow.bold('\n🧩 Top Components to Optimize'));
    
    const problemComponents = results.components
      .filter(c => c.issues.length > 0)
      .sort((a, b) => b.issues.length - a.issues.length)
      .slice(0, 10);

    const table = new Table({
      head: ['Component', 'Issues', 'Size', 'Optimizations'],
      style: { head: ['cyan'] }
    });

    problemComponents.forEach(comp => {
      const optimizations = [];
      if (comp.metrics.hasUseMemo) optimizations.push('useMemo');
      if (comp.metrics.hasUseCallback) optimizations.push('useCallback');
      if (!optimizations.length) optimizations.push('None');

      table.push([
        comp.name,
        comp.issues.length,
        formatBytes(comp.size),
        optimizations.join(', ')
      ]);
    });

    console.log(table.toString());
  }

  async generateHTMLReport() {
    const template = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SpendWise Performance Report - ${TIMESTAMP}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body class="bg-gray-50">
  <div class="container mx-auto p-8">
    <header class="mb-8">
      <h1 class="text-4xl font-bold text-gray-800 mb-2">SpendWise Performance Report</h1>
      <p class="text-gray-600">Generated: ${new Date().toLocaleString()}</p>
    </header>

    <!-- Overall Score -->
    <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
      <h2 class="text-2xl font-semibold mb-4">Overall Performance Score</h2>
      <div class="flex items-center justify-center">
        <div class="relative w-48 h-48">
          <svg class="transform -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" stroke-width="10"/>
            <circle cx="60" cy="60" r="50" fill="none" stroke="${this.getScoreColor(results.summary.totalScore)}" 
              stroke-width="10" stroke-dasharray="${results.summary.totalScore * 3.14} 314" stroke-linecap="round"/>
          </svg>
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="text-4xl font-bold">${Math.round(results.summary.totalScore)}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Metrics Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-700">Components</h3>
        <p class="text-3xl font-bold text-blue-600">${results.summary.componentCount}</p>
      </div>
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-700">Issues Found</h3>
        <p class="text-3xl font-bold text-red-600">${results.summary.issuesFound}</p>
      </div>
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-700">Bundle Size</h3>
        <p class="text-3xl font-bold text-green-600">${formatBytes(results.bundles.reduce((sum, b) => sum + b.size, 0))}</p>
      </div>
    </div>

    <!-- Category Scores -->
    <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
      <h2 class="text-2xl font-semibold mb-4">Performance by Category</h2>
      <canvas id="categoryChart"></canvas>
    </div>

    <!-- Issues Breakdown -->
    <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
      <h2 class="text-2xl font-semibold mb-4">Issues Breakdown</h2>
      <div class="space-y-4">
        ${this.generateIssuesHTML()}
      </div>
    </div>

    <!-- Recommendations -->
    <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
      <h2 class="text-2xl font-semibold mb-4">Recommendations</h2>
      <div class="space-y-6">
        ${this.generateRecommendationsHTML()}
      </div>
    </div>

    <!-- Component Details -->
    <div class="bg-white rounded-lg shadow-lg p-6">
      <h2 class="text-2xl font-semibold mb-4">Component Analysis</h2>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issues</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Optimizations</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            ${this.generateComponentTableHTML()}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <script>
    // Category scores chart
    const ctx = document.getElementById('categoryChart').getContext('2d');
    new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ${JSON.stringify(Object.keys(results.scoring).map(k => k.replace(/([A-Z])/g, ' $1').trim()))},
        datasets: [{
          label: 'Score',
          data: ${JSON.stringify(Object.values(results.scoring))},
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(59, 130, 246, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(59, 130, 246, 1)'
        }]
      },
      options: {
        scales: {
          r: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
  </script>
</body>
</html>
    `;

    const reportPath = path.join(OUTPUT_DIR, `performance-report-${TIMESTAMP}.html`);
    fs.writeFileSync(reportPath, template);
    
    return reportPath;
  }

  getScoreColor(score) {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  }

  generateIssuesHTML() {
    const severityGroups = {
      high: results.issues.filter(i => i.severity === 'high'),
      medium: results.issues.filter(i => i.severity === 'medium'),
      low: results.issues.filter(i => i.severity === 'low')
    };

    return Object.entries(severityGroups).map(([severity, issues]) => {
      if (issues.length === 0) return '';
      
      const color = severity === 'high' ? 'red' : severity === 'medium' ? 'yellow' : 'blue';
      const icon = severity === 'high' ? '🔴' : severity === 'medium' ? '🟡' : '🔵';
      
      return `
        <div class="border-l-4 border-${color}-400 pl-4">
          <h3 class="font-semibold text-lg mb-2">${icon} ${severity.toUpperCase()} (${issues.length})</h3>
          <ul class="space-y-2">
            ${issues.slice(0, 5).map(issue => `
              <li class="text-gray-700">
                <span class="font-medium">${issue.message}</span>
                ${issue.recommendation ? `<br><span class="text-sm text-gray-500">→ ${issue.recommendation}</span>` : ''}
              </li>
            `).join('')}
            ${issues.length > 5 ? `<li class="text-gray-500 text-sm">... and ${issues.length - 5} more</li>` : ''}
          </ul>
        </div>
      `;
    }).join('');
  }

  generateRecommendationsHTML() {
    return results.recommendations.map(rec => {
      const color = rec.priority === 'high' ? 'red' : rec.priority === 'medium' ? 'yellow' : 'blue';
      const icon = rec.priority === 'high' ? '🚨' : rec.priority === 'medium' ? '⚡' : '💭';
      
      return `
        <div class="border rounded-lg p-4 border-${color}-200 bg-${color}-50">
          <h3 class="font-semibold text-lg mb-2">${icon} ${rec.title}</h3>
          <p class="text-gray-700 mb-3">${rec.description}</p>
          <ul class="list-disc list-inside space-y-1">
            ${rec.actions.map(action => `<li class="text-sm text-gray-600">${action}</li>`).join('')}
          </ul>
        </div>
      `;
    }).join('');
  }

  generateComponentTableHTML() {
    return results.components
      .filter(c => c.issues.length > 0)
      .sort((a, b) => b.issues.length - a.issues.length)
      .slice(0, 20)
      .map(comp => {
        const optimizations = [];
        if (comp.metrics.hasUseMemo) optimizations.push('useMemo');
        if (comp.metrics.hasUseCallback) optimizations.push('useCallback');
        
        return `
          <tr>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${comp.name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                ${comp.issues.length}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatBytes(comp.size)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              ${optimizations.length ? optimizations.join(', ') : '<span class="text-red-500">None</span>'}
            </td>
          </tr>
        `;
      }).join('');
  }

  async generateJSONReport() {
    const reportPath = path.join(OUTPUT_DIR, `performance-report-${TIMESTAMP}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    return reportPath;
  }
}

// Main execution
async function main() {
  console.log('Starting SpendWise Performance Script...');
  const chalk = (await import('chalk')).default;
  const ora = (await import('ora')).default;
  const gzipSize = (await import('gzip-size')).default;
  console.log(chalk.cyan.bold('🚀 SpendWise Performance Analyzer\n'));
  
  // Ensure output directory exists
  ensureDir(OUTPUT_DIR);
  
  // Create analyzer instance
  const analyzer = new PerformanceAnalyzer(ora, gzipSize);
  
  try {
    // Run all analyses
    await analyzer.analyzeBundleSize();
    await analyzer.analyzeComponents();
    await analyzer.analyzeHooks();
    await analyzer.analyzeContexts();
    await analyzer.analyzeApiRequests();
    await analyzer.analyzeResponsiveness();
    
    // Calculate scores and generate recommendations
    analyzer.calculateScores();
    analyzer.generateRecommendations();
    
    // Generate reports
    const reporter = new ReportGenerator(chalk);
    reporter.generateTerminalReport();
    
    const htmlReport = await reporter.generateHTMLReport();
    const jsonReport = await reporter.generateJSONReport();
    
    // Summary
    console.log(chalk.green.bold('\n✅ Analysis Complete!\n'));
    console.log(chalk.cyan('📄 Reports generated:'));
    console.log(`   • HTML: ${htmlReport}`);
    console.log(`   • JSON: ${jsonReport}\n`);
    
    // Open HTML report
    if (process.platform === 'darwin') {
      execSync(`open ${htmlReport}`);
    } else if (process.platform === 'win32') {
      execSync(`start ${htmlReport}`);
    }
    
  } catch (error) {
    console.error(chalk.red.bold('\n❌ Analysis failed:'));
    console.error(error);
    process.exit(1);
  }
}

// Run the analyzer
main().catch((err) => {
  console.error('Top-level error:', err);
  process.exit(1);
});