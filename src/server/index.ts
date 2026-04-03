import {
  getFormOptions,
  submitFormData,
} from "@/server/controllers/form.controller";

// ── Router ────────────────────────────────────────────────────────────────────

type RouteConfig = {
  template: string;
  title: string;
};

const ROUTES: Record<string, RouteConfig> = {
  Landing: { template: "page/Landing/Landing", title: "MyGASTool" },
  FormWizard: { template: "page/FormWizard/FormWizard", title: "我的表單" },
};

const DEFAULT_ROUTE = "Landing";

// ── Sidebar / Web App 入口 ──────────────────────────────────────────────────

function doGet(e: GoogleAppsScript.Events.DoGet) {
  const page = e?.parameter?.page ?? DEFAULT_ROUTE;
  const route = ROUTES[page] ?? ROUTES[DEFAULT_ROUTE];

  return HtmlService.createTemplateFromFile(route.template)
    .evaluate()
    .setTitle(route.title)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("工具")
    .addItem("開啟表單", "openSidebar")
    .addToUi();
}

function openSidebar() {
  const html = HtmlService.createTemplateFromFile("page/FormWizard/FormWizard")
    .evaluate()
    .setTitle("我的表單");
  SpreadsheetApp.getUi().showSidebar(html);
}

// ── 全域 function 登記 ────────────────────────────────────────────────────────

// HTML include helper（供 scriptlet <?!= include() ?> 使用）
(globalThis as any).include = (filename: string): string =>
  HtmlService.createHtmlOutputFromFile(filename).getContent();

// 給前端 google.script.run 呼叫的 function
(globalThis as any).getSheetOptions = getFormOptions;
(globalThis as any).submitForm = submitFormData;
