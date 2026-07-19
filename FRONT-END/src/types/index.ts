export type Theme = "light" | "dark" | "system";
export type GlobalContext = { tenantId:string; productId:string; productName:string; productSpaceId?:string; projectId?:string; piReleaseId?:string; featureId?:string; sprintId?:string; userStoryId?:string; environment:string; selectedRelease:string; comparisonRelease?:string; userRole:string; theme:Theme };
export type Metric = { label:string; value:string; change:string; description:string; tone:"blue"|"purple"|"green"|"orange"; trend:number[] };
export type Health = { name:string; status:"Healthy"|"Degraded"|"Failed"|"Maintenance"; latency:string; uptime:string };
export type Release = { version:string; date:string; status:string; build:string; commit:string; author:string };
