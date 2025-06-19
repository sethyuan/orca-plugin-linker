import { setupL10N, t } from "./libs/l10n"
import zhCN from "./translations/zhCN"

let pluginName: string
let originalGetAssetPath: (assetPath: string) => string
let unsubscribe: () => void

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

  // Overwrite only when manually changing the settings.
  const subscribe = window.Valtio.subscribe
  unsubscribe = subscribe(orca.state.plugins[pluginName], () => {
    localStorage.setItem(
      `${pluginName}-settings`,
      JSON.stringify(orca.state.plugins[pluginName]!.settings ?? {}),
    )
  })

  originalGetAssetPath = orca.utils.getAssetPath
  orca.utils.getAssetPath = getAssetPath

  console.log(`${pluginName} loaded.`)
}

export async function unload() {
  // Clean up any resources used by the plugin here.
  orca.utils.getAssetPath = originalGetAssetPath

  if (unsubscribe) {
    unsubscribe()
  }

  console.log(`${pluginName} unloaded.`)
}

function getAssetPath(assetPath: string): string {
  const stored = localStorage.getItem(`${pluginName}-settings`)
  const settings = stored
    ? JSON.parse(stored)
    : orca.state.plugins[pluginName]?.settings
  const virtualPaths = settings?.virtualPaths ?? []

  if (!stored) {
    localStorage.setItem(
      `${pluginName}-settings`,
      JSON.stringify({ virtualPaths }),
    )
  }

  for (const { virtual, real } of virtualPaths) {
    if (!virtual) continue
    const lowerVirtual = virtual.toLowerCase()
    if (assetPath.toLowerCase().startsWith(lowerVirtual)) {
      return `${real ?? ""}${assetPath.substring(lowerVirtual.length)}`
    }
  }

  return assetPath
}
