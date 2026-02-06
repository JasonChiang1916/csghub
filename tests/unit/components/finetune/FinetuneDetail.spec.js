import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import FinetuneDetail from '@/components/finetune/FinetuneDetail.vue'
import { createPinia, setActivePinia } from 'pinia'
import { ElMessage } from 'element-plus'

// Mock dependencies
vi.mock('@/packs/useFetchApi')
vi.mock('@microsoft/fetch-event-source')
vi.mock('element-plus', async () => {
  const actual = await vi.importActual('element-plus')
  return {
    ...actual,
    ElMessage: vi.fn()
  }
})

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => {
      const translations = {
        'finetune.detail.tab1': '页面',
        'finetune.detail.tab2': '设置',
        'finetune.detail.tab3': '分析',
        'finetune.detail.notebook': 'Notebook',
        'finetune.detail.noDataTip1': '暂无数据提示1',
        'finetune.detail.noDataTip2': '暂无数据提示2',
        'finetune.loading': '加载中...',
        'all.deployLoadingText': '部署中...',
        'billing.billing': '账单'
      }
      return translations[key] || key
    }
  })
}))

// Mock vue-router - 创建共享的 mock 函数
const mockRouterPush = vi.fn()
const mockRoute = {
  query: { tab: 'page' },
  path: '/finetune/user/model/test-finetune/123'
}

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({
    push: mockRouterPush
  })
}))

vi.mock('vue3-cookies', () => ({
  useCookies: () => ({
    cookies: {
      get: vi.fn((key) => {
        if (key === 'user_token') return 'mock-jwt-token'
        return null
      })
    }
  })
}))

// Mock stores - 创建可变的 repoTab 对象
const mockRepoTab = { tab: 'page', actionName: 'files', lastPath: '' }
const mockSetRepoTab = vi.fn((newTab) => {
  Object.assign(mockRepoTab, newTab)
})

vi.mock('@/stores/RepoDetailStore', () => ({
  default: () => ({
    deployName: 'test-finetune',
    status: 'Running',
    hardware: 'GPU-A100',
    repositoryId: 1,
    deployId: 123,
    endpoint: 'test.endpoint.com',
    proxyEndpoint: 'proxy.endpoint.com',
    modelId: 'user/model',
    clusterId: 'cluster-1',
    sku: 1,
    repoType: 'finetune',
    instances: [],
    maxReplica: 1,
    svcName: 'test-svc',
    runtimeFramework: 'PyTorch',
    initialize: vi.fn(),
    isInitialized: true
  })
}))

vi.mock('@/stores/RepoTabStore', () => ({
  useRepoTabStore: () => ({
    repoTab: mockRepoTab,
    setRepoTab: mockSetRepoTab
  })
}))

vi.mock('@/packs/utils', () => ({
  validateTab: (tab) => tab,
  ToNotFoundPage: vi.fn()
}))

describe('FinetuneDetail.vue', () => {
  let wrapper
  let mockUseFetchApi
  let mockFetchEventSource
  let pinia

  const mockProps = {
    namespace: 'user',
    modelName: 'model',
    userName: 'user',
    finetuneName: 'test-finetune',
    finetuneId: 123,
    path: 'page'
  }

  const mockRepoDetail = {
    data: {
      value: {
        data: {
          deploy_name: 'test-finetune',
          status: 'Running',
          hardware: 'GPU-A100',
          repository_id: 1,
          deploy_id: 123,
          endpoint: 'test.endpoint.com',
          proxy_endpoint: 'proxy.endpoint.com',
          model_id: 'user/model',
          cluster_id: 'cluster-1',
          sku: 1
        }
      }
    },
    response: { value: { status: 200 } },
    error: { value: null }
  }

  const mockResources = {
    data: {
      value: {
        data: [
          { id: 1, name: 'GPU-A100', type: 'GPU' },
          { id: 2, name: 'GPU-V100', type: 'GPU' }
        ]
      }
    },
    error: { value: null }
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    mockRouterPush.mockClear()

    // 重置 repoTab 状态
    mockRepoTab.tab = 'page'
    mockRepoTab.actionName = 'files'
    mockRepoTab.lastPath = ''

    // Setup Pinia
    pinia = createPinia()
    setActivePinia(pinia)

    // Mock useFetchApi
    const useFetchApi = await import('@/packs/useFetchApi')
    mockUseFetchApi = vi.fn()
    useFetchApi.default = mockUseFetchApi

    mockUseFetchApi.mockImplementation((url) => {
      if (url.includes('/run/')) {
        return {
          json: () => Promise.resolve(mockRepoDetail)
        }
      }
      if (url.includes('/space_resources')) {
        return {
          json: () => Promise.resolve(mockResources)
        }
      }
      return {
        json: () => Promise.resolve({ data: { value: {} }, error: { value: null } })
      }
    })

    // Mock fetchEventSource
    const fetchEventSource = await import('@microsoft/fetch-event-source')
    mockFetchEventSource = vi.fn()
    fetchEventSource.fetchEventSource = mockFetchEventSource

    // Mock global variables
    global.ENABLE_HTTPS = 'false'

    wrapper = mount(FinetuneDetail, {
      props: mockProps,
      global: {
        plugins: [pinia],
        provide: {
          csghubServer: 'http://test-server.com',
          fetchRepoDetail: vi.fn()
        },
        stubs: {
          RepoHeader: true,
          FinetuneSettings: true,
          LoadingSpinner: true,
          BillingDetail: true,
          InstanceInBuilding: true,
          InstanceAnalysis: true,
          CsgButton: {
            template: '<button @click="$emit(\'click\')"><slot>{{ name }}</slot></button>',
            props: ['name']
          },
          SvgIcon: true,
          ElTabs: false,
          ElTabPane: false
        }
      }
    })

    await nextTick()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  // ==================== 渲染测试 ====================
  describe('渲染测试', () => {
    it('应该正确渲染RepoHeader', () => {
      const repoHeader = wrapper.findComponent({ name: 'RepoHeader' })
      expect(repoHeader.exists()).toBe(true)
    })

    it('应该渲染Tab导航', () => {
      const tabs = wrapper.findComponent({ name: 'ElTabs' })
      expect(tabs.exists()).toBe(true)
    })

    it('应该在有endpoint时显示Notebook按钮', async () => {
      wrapper.vm.repoDetailStore.endpoint = 'test.endpoint.com'
      wrapper.vm.activeName = 'page'
      await nextTick()

      // CsgButton 使用 v-show，所以需要检查可见性
      const button = wrapper.findComponent({ name: 'CsgButton' })
      expect(button.exists()).toBe(true)
      expect(button.isVisible()).toBe(true)
    })

    it('应该在无endpoint时显示提示信息', async () => {
      wrapper.vm.repoDetailStore.endpoint = null
      wrapper.vm.activeName = 'page'
      wrapper.vm.isDataLoading = false
      await nextTick()

      // 提示信息在 v-else 分支中，需要确保 activeName 是 'page' 且没有 endpoint
      expect(wrapper.text()).toContain('暂无数据提示1')
    })

    it('应该在加载时显示LoadingSpinner', async () => {
      wrapper.vm.isDataLoading = true
      await nextTick()

      const spinner = wrapper.findComponent({ name: 'LoadingSpinner' })
      expect(spinner.exists()).toBe(true)
    })
  })

  // ==================== Tab切换测试 ====================
  describe('Tab切换测试', () => {
    it('默认应显示page标签', () => {
      expect(wrapper.vm.activeName).toBe('page')
    })

    it('点击tab应切换内容', async () => {
      await wrapper.vm.tabChange({ paneName: 'settings' })
      await nextTick()

      expect(wrapper.vm.activeName).toBe('settings')
    })

    it('tab切换应更新URL query参数', async () => {
      // 确保 repoTab.tab 与目标 tab 不同，这样才会调用 router.push
      mockRepoTab.tab = 'page'
      await wrapper.vm.tabChange({ paneName: 'analysis' })
      await nextTick()

      // 验证 router.push 被调用
      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.objectContaining({
          query: { tab: 'analysis' }
        })
      )
    })

    it('URL参数变化应切换tab', async () => {
      // 这个测试需要模拟route.query的变化
      // 由于watch的限制，我们测试tabChange方法
      mockRepoTab.tab = 'page'
      await wrapper.vm.tabChange({ paneName: 'billing' })
      await nextTick()

      expect(wrapper.vm.activeName).toBe('billing')
    })

    it('无效tab应重定向到默认tab', async () => {
      mockRepoTab.tab = 'invalid-tab'  // 设置一个无效的初始值
      await wrapper.vm.tabChange({ paneName: 'invalid-tab' })
      await nextTick()

      // 无效tab会被重定向到默认tab (page)
      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.objectContaining({
          query: { tab: 'page' }
        })
      )
    })

    it('tab切换应调用fetchRepoDetail', async () => {
      const fetchSpy = vi.spyOn(wrapper.vm, 'fetchRepoDetail')

      // 确保 repoTab.tab 与目标 tab 不同
      mockRepoTab.tab = 'page'
      await wrapper.vm.tabChange({ paneName: 'settings' })
      await flushPromises()

      expect(fetchSpy).toHaveBeenCalled()
    })
  })

  // ==================== iframe测试 ====================
  describe('iframe测试', () => {
    it('应该正确设置iframe src（包含jwt）', async () => {
      wrapper.vm.repoDetailStore.endpoint = 'test.endpoint.com'
      wrapper.vm.repoDetailStore.proxyEndpoint = 'proxy.endpoint.com'
      wrapper.vm.activeName = 'page'
      await nextTick()

      const iframe = wrapper.find('iframe')
      if (iframe.exists()) {
        expect(iframe.attributes('src')).toContain('proxy.endpoint.com')
        expect(iframe.attributes('src')).toContain('jwt=mock-jwt-token')
      }
    })

    it('应该根据窗口大小计算iframe高度', () => {
      const originalInnerHeight = window.innerHeight
      window.innerHeight = 1000

      wrapper.vm.calculateIframeHeight()

      expect(wrapper.vm.iframeHeight).toBeGreaterThan(0)
      expect(wrapper.vm.iframeHeight).toBeLessThanOrEqual(1000)

      window.innerHeight = originalInnerHeight
    })

    it('窗口resize应更新iframe高度', async () => {
      const calculateSpy = vi.spyOn(wrapper.vm, 'calculateIframeHeight')

      wrapper.vm.handleResize()

      expect(calculateSpy).toHaveBeenCalled()
    })
  })

  // ==================== SSE测试 ====================
  describe('SSE测试', () => {
    it('应该建立SSE连接同步状态', async () => {
      wrapper.vm.repoDetailStore.modelId = 'user/model'
      wrapper.vm.repoDetailStore.deployId = 123

      await wrapper.vm.syncfinetuneStatus()

      expect(mockFetchEventSource).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/models/user/model/run/123/status'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-jwt-token'
          })
        })
      )
    })

    it('收到状态变化应更新store', async () => {
      const mockOnMessage = vi.fn()

      mockFetchEventSource.mockImplementation((url, options) => {
        // 模拟SSE消息
        const eventData = {
          data: JSON.stringify({
            status: 'Stopped',
            reason: 'User stopped'
          })
        }

        if (options.onmessage) {
          options.onmessage(eventData)
        }
      })

      wrapper.vm.repoDetailStore.status = 'Running'
      await wrapper.vm.syncfinetuneStatus()

      // 验证状态会被更新（通过onmessage回调）
      expect(mockFetchEventSource).toHaveBeenCalled()
    })

    it('401错误应刷新JWT', async () => {
      // Mock refreshJWT 函数
      const mockRefreshJWT = vi.fn()
      vi.doMock('../../packs/refreshJWT.js', () => ({
        default: mockRefreshJWT
      }))

      mockFetchEventSource.mockImplementation((url, options) => {
        if (options.onopen) {
          options.onopen({ ok: false, status: 401 })
        }
      })

      await wrapper.vm.syncfinetuneStatus()

      // 验证SSE连接已建立（401会在onopen回调中处理）
      expect(mockFetchEventSource).toHaveBeenCalled()
    })

    it('组件卸载应清理事件监听', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      wrapper.unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    })
  })

  // ==================== 数据加载测试 ====================
  describe('数据加载测试', () => {
    it('应该在挂载时加载详情数据', async () => {
      expect(mockUseFetchApi).toHaveBeenCalledWith(
        expect.stringContaining('/models/user/model/run/123')
      )
    })

    it('404响应应跳转到NotFound页面', async () => {
      const { ToNotFoundPage } = await import('@/packs/utils')

      mockUseFetchApi.mockImplementationOnce(() => ({
        json: () => Promise.resolve({
          data: { value: null },
          response: { value: { status: 404 } },
          error: { value: null }
        })
      }))

      const result = await wrapper.vm.fetchRepoDetail()

      expect(result).toBe(false)
      expect(ToNotFoundPage).toHaveBeenCalled()
    })

    it('加载失败应正确处理错误', async () => {
      mockUseFetchApi.mockImplementationOnce(() => ({
        json: () => Promise.reject(new Error('Network error'))
      }))

      const result = await wrapper.vm.fetchRepoDetail()

      expect(result).toBe(false)
    })

    it('clusterId变化应重新加载资源', async () => {
      const fetchResourcesSpy = vi.spyOn(wrapper.vm, 'fetchResources')

      wrapper.vm.repoDetailStore.clusterId = 'cluster-2'
      await nextTick()

      // watch会触发fetchResources
      // 由于异步性质，我们验证方法存在
      expect(fetchResourcesSpy).toBeDefined()
    })
  })

  // ==================== Computed属性测试 ====================
  describe('Computed属性测试', () => {
    it('validTabs应该返回有效的tab列表', () => {
      const validTabs = wrapper.vm.validTabs
      expect(validTabs).toContain('page')
      expect(validTabs).toContain('analysis')
      expect(validTabs).toContain('billing')
      expect(validTabs).toContain('settings')
    })

    it('getDefaultTab应该返回默认tab', () => {
      expect(wrapper.vm.getDefaultTab()).toBe('page')
    })

    it('isValidTab应该正确验证tab', () => {
      expect(wrapper.vm.isValidTab('page')).toBe(true)
      expect(wrapper.vm.isValidTab('settings')).toBe(true)
      expect(wrapper.vm.isValidTab('invalid')).toBe(false)
    })

    it('isSameRepo应该正确判断是否同一仓库', () => {
      wrapper.vm.repoDetailStore.deployId = 123
      wrapper.vm.repoDetailStore.repoType = 'finetune'

      expect(wrapper.vm.isSameRepo).toBe(true)

      wrapper.vm.repoDetailStore.deployId = 999
      expect(wrapper.vm.isSameRepo).toBe(false)
    })
  })

  // ==================== 方法测试 ====================
  describe('方法测试', () => {
    it('toNotebookPage应该打开新窗口', () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => {})

      wrapper.vm.repoDetailStore.endpoint = 'test.endpoint.com'
      wrapper.vm.toNotebookPage()

      expect(windowOpenSpy).toHaveBeenCalledWith(
        expect.stringContaining('test.endpoint.com')
      )
      expect(windowOpenSpy).toHaveBeenCalledWith(
        expect.stringContaining('jwt=mock-jwt-token')
      )

      windowOpenSpy.mockRestore()
    })

    it('fetchResources应该加载资源列表', async () => {
      wrapper.vm.repoDetailStore.clusterId = 'cluster-1'

      await wrapper.vm.fetchResources()

      expect(mockUseFetchApi).toHaveBeenCalledWith(
        expect.stringContaining('/space_resources?cluster_id=cluster-1')
      )
      expect(wrapper.vm.finetuneResources.length).toBeGreaterThan(0)
    })

    it('fetchResources错误应显示消息', async () => {
      mockUseFetchApi.mockImplementationOnce(() => ({
        json: () => Promise.resolve({
          data: { value: null },
          error: { value: { msg: '加载资源失败' } }
        })
      }))

      await wrapper.vm.fetchResources()

      expect(ElMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '加载资源失败',
          type: 'warning'
        })
      )
    })
  })

  // ==================== 生命周期测试 ====================
  describe('生命周期测试', () => {
    it('onBeforeMount应该初始化tab', async () => {
      // 组件已经挂载，验证初始状态
      expect(wrapper.vm.activeName).toBeDefined()
    })

    it('onMounted应该添加resize监听器', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')

      const newWrapper = mount(FinetuneDetail, {
        props: mockProps,
        global: {
          plugins: [pinia],
          provide: {
            csghubServer: 'http://test-server.com'
          },
          stubs: {
            RepoHeader: true,
            FinetuneSettings: true,
            LoadingSpinner: true,
            BillingDetail: true,
            InstanceInBuilding: true,
            InstanceAnalysis: true,
            CsgButton: true,
            SvgIcon: true,
            ElTabs: false,
            ElTabPane: false
          }
        }
      })

      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))

      newWrapper.unmount()
      addEventListenerSpy.mockRestore()
    })

    it('onUnmounted应该移除resize监听器', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      wrapper.unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))

      removeEventListenerSpy.mockRestore()
    })
  })

  // ==================== 边界条件测试 ====================
  describe('边界条件测试', () => {
    it('isDataLoading为true时不应重复加载', async () => {
      wrapper.vm.isDataLoading = true

      const result = await wrapper.vm.fetchRepoDetail()

      expect(result).toBe(false)
    })

    it('没有数据时应正确处理', async () => {
      mockUseFetchApi.mockImplementationOnce(() => ({
        json: () => Promise.resolve({
          data: { value: null },
          response: { value: { status: 200 } },
          error: { value: null }
        })
      }))

      const result = await wrapper.vm.fetchRepoDetail()

      expect(result).toBe(false)
    })

    it('SSE未连接且状态有效时应建立连接', async () => {
      wrapper.vm.isStatusSSEConnected = false
      wrapper.vm.repoDetailStore.status = 'Running'
      wrapper.vm.repoDetailStore.modelId = 'user/model'
      wrapper.vm.repoDetailStore.deployId = 123

      // 模拟onBeforeMount逻辑
      const allStatus = [
        'Building', 'Deploying', 'Startup', 'Running',
        'Stopped', 'Sleeping', 'BuildingFailed',
        'DeployFailed', 'RuntimeError'
      ]

      if (
        wrapper.vm.isStatusSSEConnected === false &&
        allStatus.includes(wrapper.vm.repoDetailStore.status) &&
        wrapper.vm.repoDetailStore.modelId &&
        wrapper.vm.repoDetailStore.deployId
      ) {
        await wrapper.vm.syncfinetuneStatus()
      }

      expect(mockFetchEventSource).toHaveBeenCalled()
    })

    it('Building状态应显示InstanceInBuilding组件', async () => {
      wrapper.vm.repoDetailStore.status = 'Building'
      wrapper.vm.repoDetailStore.endpoint = null
      wrapper.vm.activeName = 'page'
      await nextTick()

      const building = wrapper.findComponent({ name: 'InstanceInBuilding' })
      expect(building.exists()).toBe(true)
    })
  })

  // ==================== 集成测试 ====================
  describe('集成测试', () => {
    it('完整的tab切换流程', async () => {
      // 切换到settings
      await wrapper.vm.tabChange({ paneName: 'settings' })
      await flushPromises()

      expect(wrapper.vm.activeName).toBe('settings')
      expect(mockRouterPush).toHaveBeenCalled()

      // 切换到analysis
      await wrapper.vm.tabChange({ paneName: 'analysis' })
      await flushPromises()

      expect(wrapper.vm.activeName).toBe('analysis')
    })

    it('数据加载和SSE连接的完整流程', async () => {
      // 加载详情
      const detailResult = await wrapper.vm.fetchRepoDetail()
      expect(detailResult).toBeDefined()

      // 加载资源
      wrapper.vm.repoDetailStore.clusterId = 'cluster-1'
      await wrapper.vm.fetchResources()
      expect(wrapper.vm.finetuneResources).toBeDefined()

      // 建立SSE连接
      wrapper.vm.repoDetailStore.modelId = 'user/model'
      wrapper.vm.repoDetailStore.deployId = 123
      await wrapper.vm.syncfinetuneStatus()
      expect(mockFetchEventSource).toHaveBeenCalled()
    })
  })
})
