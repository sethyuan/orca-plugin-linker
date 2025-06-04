import { setupL10N, t } from "./libs/l10n"
import zhCN from "./translations/zhCN"

let pluginName: string
let originalGetAssetPath: (assetPath: string) => string

export async function load(_name: string) {
  pluginName = _name

  setupL10N(orca.state.locale, { "zh-CN": zhCN })

  await orca.plugins.setSettingsSchema(pluginName, {
    virtualPaths: {
      label: t("Virtual paths"),
      type: "array",
      arrayItemSchema: {
        virtual: {
          label: t("Virtual path"),
          type: "string",
          description: t(
            "Prefix of the resource path to replace. (case insensitive)",
          ),
          defaultValue: "",
        },
        real: {
          label: t("Real path"),
          type: "string",
          description: t("Replace the above prefix with this value."),
          defaultValue: "",
        },
      },
    },
  })

  originalGetAssetPath = orca.utils.getAssetPath
  orca.utils.getAssetPath = getAssetPath

  console.log(`${pluginName} loaded.`)
}

export async function unload() {
  // Clean up any resources used by the plugin here.
  orca.utils.getAssetPath = originalGetAssetPath

  console.log(`${pluginName} unloaded.`)
}

function getAssetPath(assetPath: string): string {
  const virtualPaths =
    orca.state.plugins[pluginName]?.settings?.virtualPaths ?? []

  for (const { virtual, real } of virtualPaths) {
    if (!virtual) continue
    const lowerVirtual = virtual.toLowerCase()
    if (assetPath.toLowerCase().startsWith(lowerVirtual)) {
      return `${real ?? ""}${assetPath.substring(lowerVirtual.length)}`
    }
  }

  return assetPath
}
