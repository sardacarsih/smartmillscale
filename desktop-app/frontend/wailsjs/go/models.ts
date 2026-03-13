export namespace main {
	
	export class SyncStatusResponse {
	    isSyncing: boolean;
	    pendingCount: number;
	    successCount: number;
	    failedCount: number;
	    lastSyncAt?: string;
	    lastSyncSuccess: boolean;
	    nextSyncAt?: string;
	    errorRate: number;
	    lastError?: string;
	
	    static createFrom(source: any = {}) {
	        return new SyncStatusResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.isSyncing = source["isSyncing"];
	        this.pendingCount = source["pendingCount"];
	        this.successCount = source["successCount"];
	        this.failedCount = source["failedCount"];
	        this.lastSyncAt = source["lastSyncAt"];
	        this.lastSyncSuccess = source["lastSyncSuccess"];
	        this.nextSyncAt = source["nextSyncAt"];
	        this.errorRate = source["errorRate"];
	        this.lastError = source["lastError"];
	    }
	}

}

export namespace service {
	
	export class AnomalySummary {
	    totalOutliers: number;
	    totalIncomplete: number;
	    totalDuplicates: number;
	    totalMissingSecond: number;
	
	    static createFrom(source: any = {}) {
	        return new AnomalySummary(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.totalOutliers = source["totalOutliers"];
	        this.totalIncomplete = source["totalIncomplete"];
	        this.totalDuplicates = source["totalDuplicates"];
	        this.totalMissingSecond = source["totalMissingSecond"];
	    }
	}
	export class DuplicateVehicleEntry {
	    vehicleNumber: string;
	    count: number;
	    transactionIds: string[];
	
	    static createFrom(source: any = {}) {
	        return new DuplicateVehicleEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.vehicleNumber = source["vehicleNumber"];
	        this.count = source["count"];
	        this.transactionIds = source["transactionIds"];
	    }
	}
	export class IncompleteTransaction {
	    transaction: TransactionDetail;
	    ageHours: number;
	    stage: string;
	    reason: string;
	
	    static createFrom(source: any = {}) {
	        return new IncompleteTransaction(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.transaction = this.convertValues(source["transaction"], TransactionDetail);
	        this.ageHours = source["ageHours"];
	        this.stage = source["stage"];
	        this.reason = source["reason"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class TransactionDetail {
	    noTransaksi: string;
	    // Go type: time
	    tanggal: any;
	    // Go type: time
	    timbang1Date: any;
	    // Go type: time
	    timbang2Date?: any;
	    nomorKendaraan: string;
	    supplierName: string;
	    supplierType: string;
	    supplierId?: number;
	    productName: string;
	    productCode?: string;
	    productId?: number;
	    grade: string;
	    qualityGrade: string;
	    bruto: number;
	    tara: number;
	    netto: number;
	    bruto2?: number;
	    tara2?: number;
	    netto2?: number;
	    status: string;
	    statusPKS: string;
	    isRejected: boolean;
	    officer1Name: string;
	    officer2Name?: string;
	    officer1Id?: number;
	    officer2Id?: number;
	    notes?: string;
	    photoPath?: string;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	    // Go type: time
	    syncedAt?: any;
	
	    static createFrom(source: any = {}) {
	        return new TransactionDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.noTransaksi = source["noTransaksi"];
	        this.tanggal = this.convertValues(source["tanggal"], null);
	        this.timbang1Date = this.convertValues(source["timbang1Date"], null);
	        this.timbang2Date = this.convertValues(source["timbang2Date"], null);
	        this.nomorKendaraan = source["nomorKendaraan"];
	        this.supplierName = source["supplierName"];
	        this.supplierType = source["supplierType"];
	        this.supplierId = source["supplierId"];
	        this.productName = source["productName"];
	        this.productCode = source["productCode"];
	        this.productId = source["productId"];
	        this.grade = source["grade"];
	        this.qualityGrade = source["qualityGrade"];
	        this.bruto = source["bruto"];
	        this.tara = source["tara"];
	        this.netto = source["netto"];
	        this.bruto2 = source["bruto2"];
	        this.tara2 = source["tara2"];
	        this.netto2 = source["netto2"];
	        this.status = source["status"];
	        this.statusPKS = source["statusPKS"];
	        this.isRejected = source["isRejected"];
	        this.officer1Name = source["officer1Name"];
	        this.officer2Name = source["officer2Name"];
	        this.officer1Id = source["officer1Id"];
	        this.officer2Id = source["officer2Id"];
	        this.notes = source["notes"];
	        this.photoPath = source["photoPath"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	        this.syncedAt = this.convertValues(source["syncedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class OutlierTransaction {
	    transaction: TransactionDetail;
	    zScore: number;
	    deviation: number;
	    reason: string;
	
	    static createFrom(source: any = {}) {
	        return new OutlierTransaction(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.transaction = this.convertValues(source["transaction"], TransactionDetail);
	        this.zScore = source["zScore"];
	        this.deviation = source["deviation"];
	        this.reason = source["reason"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class AnomalyReport {
	    outlierTransactions: OutlierTransaction[];
	    incompleteTransactions: IncompleteTransaction[];
	    duplicateVehicles: DuplicateVehicleEntry[];
	    missingSecondWeighing: TransactionDetail[];
	    summary: AnomalySummary;
	
	    static createFrom(source: any = {}) {
	        return new AnomalyReport(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.outlierTransactions = this.convertValues(source["outlierTransactions"], OutlierTransaction);
	        this.incompleteTransactions = this.convertValues(source["incompleteTransactions"], IncompleteTransaction);
	        this.duplicateVehicles = this.convertValues(source["duplicateVehicles"], DuplicateVehicleEntry);
	        this.missingSecondWeighing = this.convertValues(source["missingSecondWeighing"], TransactionDetail);
	        this.summary = this.convertValues(source["summary"], AnomalySummary);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class DailyTrendPoint {
	    date: string;
	    totalWeight: number;
	    transCount: number;
	    avgWeight: number;
	
	    static createFrom(source: any = {}) {
	        return new DailyTrendPoint(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.date = source["date"];
	        this.totalWeight = source["totalWeight"];
	        this.transCount = source["transCount"];
	        this.avgWeight = source["avgWeight"];
	    }
	}
	export class DatePreset {
	    key: string;
	    label: string;
	    description: string;
	    // Go type: time
	    startDate: any;
	    // Go type: time
	    endDate: any;
	
	    static createFrom(source: any = {}) {
	        return new DatePreset(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.key = source["key"];
	        this.label = source["label"];
	        this.description = source["description"];
	        this.startDate = this.convertValues(source["startDate"], null);
	        this.endDate = this.convertValues(source["endDate"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class FilterOption {
	    value: string;
	    label: string;
	    count?: number;
	    data?: any;
	
	    static createFrom(source: any = {}) {
	        return new FilterOption(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.value = source["value"];
	        this.label = source["label"];
	        this.count = source["count"];
	        this.data = source["data"];
	    }
	}
	export class GradeDistributionPoint {
	    grade: string;
	    count: number;
	    weight: number;
	    percentage: number;
	
	    static createFrom(source: any = {}) {
	        return new GradeDistributionPoint(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.grade = source["grade"];
	        this.count = source["count"];
	        this.weight = source["weight"];
	        this.percentage = source["percentage"];
	    }
	}
	export class HourlyDistributionPoint {
	    hour: number;
	    count: number;
	
	    static createFrom(source: any = {}) {
	        return new HourlyDistributionPoint(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.hour = source["hour"];
	        this.count = source["count"];
	    }
	}
	
	
	export class RejectionData {
	    count: number;
	    totalWeight: number;
	    percentage: number;
	    reasons: Record<string, number>;
	
	    static createFrom(source: any = {}) {
	        return new RejectionData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.count = source["count"];
	        this.totalWeight = source["totalWeight"];
	        this.percentage = source["percentage"];
	        this.reasons = source["reasons"];
	    }
	}
	export class ReportMetadata {
	    // Go type: time
	    generatedAt: any;
	    generatedBy: string;
	    // Go type: time
	    periodStart: any;
	    // Go type: time
	    periodEnd: any;
	    totalRecords: number;
	    version: string;
	
	    static createFrom(source: any = {}) {
	        return new ReportMetadata(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.generatedAt = this.convertValues(source["generatedAt"], null);
	        this.generatedBy = source["generatedBy"];
	        this.periodStart = this.convertValues(source["periodStart"], null);
	        this.periodEnd = this.convertValues(source["periodEnd"], null);
	        this.totalRecords = source["totalRecords"];
	        this.version = source["version"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class SourceDistributionPoint {
	    name: string;
	    value: number;
	    count: number;
	    percentage: number;
	
	    static createFrom(source: any = {}) {
	        return new SourceDistributionPoint(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.value = source["value"];
	        this.count = source["count"];
	        this.percentage = source["percentage"];
	    }
	}
	export class TrendAnalysis {
	    dailyTrends: DailyTrendPoint[];
	    hourlyDistribution?: HourlyDistributionPoint[];
	    sourceDistribution: SourceDistributionPoint[];
	    gradeDistribution: GradeDistributionPoint[];
	
	    static createFrom(source: any = {}) {
	        return new TrendAnalysis(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.dailyTrends = this.convertValues(source["dailyTrends"], DailyTrendPoint);
	        this.hourlyDistribution = this.convertValues(source["hourlyDistribution"], HourlyDistributionPoint);
	        this.sourceDistribution = this.convertValues(source["sourceDistribution"], SourceDistributionPoint);
	        this.gradeDistribution = this.convertValues(source["gradeDistribution"], GradeDistributionPoint);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class WeightSummary {
	    totalFirstWeight: number;
	    totalSecondWeight: number;
	    totalNetWeight: number;
	    totalTareWeight: number;
	
	    static createFrom(source: any = {}) {
	        return new WeightSummary(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.totalFirstWeight = source["totalFirstWeight"];
	        this.totalSecondWeight = source["totalSecondWeight"];
	        this.totalNetWeight = source["totalNetWeight"];
	        this.totalTareWeight = source["totalTareWeight"];
	    }
	}
	export class TBSTypeData {
	    count: number;
	    totalWeight: number;
	    percentage: number;
	
	    static createFrom(source: any = {}) {
	        return new TBSTypeData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.count = source["count"];
	        this.totalWeight = source["totalWeight"];
	        this.percentage = source["percentage"];
	    }
	}
	export class ReportSummary {
	    totalTransactions: number;
	    totalVehicles: number;
	    tbsByType: Record<string, TBSTypeData>;
	    totalRejections: RejectionData;
	    weightSummary: WeightSummary;
	    averageWeight: number;
	
	    static createFrom(source: any = {}) {
	        return new ReportSummary(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.totalTransactions = source["totalTransactions"];
	        this.totalVehicles = source["totalVehicles"];
	        this.tbsByType = this.convertValues(source["tbsByType"], TBSTypeData, true);
	        this.totalRejections = this.convertValues(source["totalRejections"], RejectionData);
	        this.weightSummary = this.convertValues(source["weightSummary"], WeightSummary);
	        this.averageWeight = source["averageWeight"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ReportData {
	    summary: ReportSummary;
	    transactions: TransactionDetail[];
	    trends: TrendAnalysis;
	    anomalies: AnomalyReport;
	    metadata: ReportMetadata;
	
	    static createFrom(source: any = {}) {
	        return new ReportData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.summary = this.convertValues(source["summary"], ReportSummary);
	        this.transactions = this.convertValues(source["transactions"], TransactionDetail);
	        this.trends = this.convertValues(source["trends"], TrendAnalysis);
	        this.anomalies = this.convertValues(source["anomalies"], AnomalyReport);
	        this.metadata = this.convertValues(source["metadata"], ReportMetadata);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ReportFilterOptions {
	    suppliers: FilterOption[];
	    products: FilterOption[];
	    grades: FilterOption[];
	    statuses: FilterOption[];
	
	    static createFrom(source: any = {}) {
	        return new ReportFilterOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.suppliers = this.convertValues(source["suppliers"], FilterOption);
	        this.products = this.convertValues(source["products"], FilterOption);
	        this.grades = this.convertValues(source["grades"], FilterOption);
	        this.statuses = this.convertValues(source["statuses"], FilterOption);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ReportFilters {
	    supplierIds: number[];
	    productIds: number[];
	    statusFilter: string;
	    gradeFilter: string[];
	
	    static createFrom(source: any = {}) {
	        return new ReportFilters(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.supplierIds = source["supplierIds"];
	        this.productIds = source["productIds"];
	        this.statusFilter = source["statusFilter"];
	        this.gradeFilter = source["gradeFilter"];
	    }
	}
	
	export class ReportRequest {
	    // Go type: time
	    startDate: any;
	    // Go type: time
	    endDate: any;
	    reportType: string;
	    filters: ReportFilters;
	
	    static createFrom(source: any = {}) {
	        return new ReportRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.startDate = this.convertValues(source["startDate"], null);
	        this.endDate = this.convertValues(source["endDate"], null);
	        this.reportType = source["reportType"];
	        this.filters = this.convertValues(source["filters"], ReportFilters);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	
	
	
	export class ValidationResult {
	    isValid: boolean;
	    errors: string[];
	    warnings: string[];
	
	    static createFrom(source: any = {}) {
	        return new ValidationResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.isValid = source["isValid"];
	        this.errors = source["errors"];
	        this.warnings = source["warnings"];
	    }
	}

}

