import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import FinetuneSettings from '@/components/finetune/FinetuneSettings.vue'
import { ElMessage } from 'element-plus'

// Mock dependencies
vi.mock('@/packs/useFetchApi')
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
        'finetune.detail.settings.enName': '英文名称',
        'finetune.detail.settings.enNameTip1': '英文名称提示',
        'finetune.detail.settings.cnName': '别名',
        'finetune.detail.settings.cnNameTip1': '别名提示',
        'endpoints.settings.stopEndpoint': '暂停端点',
        'endpoints.settings.stop': '暂停',
        'endpoints.settings.restartEndpoint': '重启端点',
        'endpoints.settings.restart': '重启',
        'finetune.detail.settings.region': '区域',
        'finetune.detail.settings.regionTip1': '区域提示1',
        'finetune.detail.settings.regionTip2': '区域提示2',
        'finetune.detail.settings.regionTip3': '当前区域',
        'finetune.detail.settings.resources': '云资源',
        'finetune.detail.settings.resourcesTip1': '资源提示1',
        'finetune.detail.settings.resourcesTip2': '资源提示2',
        'finetune.detail.settings.resourcesTip3': '当前资源',
        'finetune.detail.settings.delete': '删除',
        'finetune.detail.settings.deleteTip1': '删除提示1',
        'finetune.detail.settings.deleteTip2': '删除提示2',
        'finetune.detail.settings.finetuneName': '微调名称',
        'endpoints.settings.confirmDel': '确认删除',
        'all.select': '选择',
        'all.updateSuccess': '更新成功',
        'all.delSuccess': '删除成功',
        'all.enterPls': '请输入',
        'all.sureDel': '确认删除'
      }
      return translations[key] || key
    }
  })
}))

// Mock fetchResourcesInCategory - 必须在 vi.mock 内部定义
vi.mock('@/components/shared/deploy_instance/fetchResourceInCategory', () => ({
  fetchResourcesInCategory: vi.fn()
}))

describe('FinetuneSettings.vue', () => {
  let wrapper
  let mockUseFetchApi

  const mockProps = {
    finetune: {
      sku: 1,
      clusterId: 'cluster-1'
    },
    finetuneId: 123,
    finetuneName: 'test-finetune',
    appStatus: 'Running',
    modelId: 'user/model',
    framework: 'PyTorch'
  }

  const mockClusters = {
    data: {
      value: {
        data: [
          { cluster_id: 'cluster-1', region: '北京' },
          { cluster_id: 'cluster-2', region: '上海' }
        ]
      }
    },
    error: { value: null }
  }

  const mockResources = [
    {
      label: 'GPU',
      options: [
        {
          id: 1,
          name: 'GPU-A100',
          label: 'A100 (40GB)',
          type: 'GPU',
          is_available: true
        },
        {
          id: 2,
          name: 'GPU-V100',
          label: 'V100 (32GB)',
          type: 'GPU',
          is_available: true
        }
      ]
    }
  ]

  const mockFrameworks = {
    data: {
      value: {
        data: [
          {
            id: 1,
            frame_name: 'pytorch',
            compute_type: 'GPU'
          },
          {
            id: 2,
            frame_name: 'tensorflow',
            compute_type: 'GPU'
          }
        ]
      }
    },
    error: { value: null }
  }

  beforeEach(async () => {
    vi.clearAllMocks()

    const useFetchApi = await import('@/packs/useFetchApi')
    mockUseFetchApi = vi.fn()
    useFetchApi.default = mockUseFetchApi

    // Setup fetchResourcesInCategory mock - 从 mock 中获取
    const { fetchResourcesInCategory } = await import('@/components/shared/deploy_instance/fetchResourceInCategory')
    fetchResourcesInCategory.mockResolvedValue(mockResources)

    mockUseFetchApi.mockImplementation((url) => {
      if (url === '/cluster') {
        return { json: () => Promise.resolve(mockClusters) }
      }
      if (url.includes('/runtime_framework')) {
        return { json: () => Promise.resolve(mockFrameworks) }
      }
      if (url.includes('/stop') || url.includes('/start')) {
        return {
          put: () => ({
            json: () => Promise.resolve({ data: { value: {} }, error: { value: null } })
          })
        }
      }
      if (url.includes('/finetune/')) {
        return {
          delete: () => ({
            json: () => Promise.resolve({ data: { value: {} }, error: { value: null } })
          })
        }
      }
      return { json: () => Promise.resolve({ data: { value: {} }, error: { value: null } }) }
    })

    wrapper = mount(FinetuneSettings, {
      props: mockProps,
      global: {
        stubs: {
          CsgButton: {
            template: '<button @click="$emit(\'click\')" :disabled="disabled"><slot>{{ name }}</slot></button>',
            props: ['name', 'disabled']
          },
          ElInput: false,
          ElSelect: false,
          ElOption: false,
          ElOptionGroup: false,
          ElDivider: true,
          ElSkeleton: true,
          ElSkeletonItem: true
        }
      }
    })

    await nextTick()
  })

  // ==================== 渲染测试 ====================
  describe('渲染测试', () => {
    it('应该正确渲染所有设置项', () => {
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).toContain('英文名称')
      expect(wrapper.text()).toContain('别名')
      expect(wrapper.text()).toContain('暂停端点')
      expect(wrapper.text()).toContain('重启端点')
      expect(wrapper.text()).toContain('区域')
      expect(wrapper.text()).toContain('云资源')
      expect(wrapper.text()).toContain('删除')
    })

    it('应该显示微调名称（禁用状态）', () => {
      const nameInput = wrapper.findAllComponents({ name: 'ElInput' })[0]
      expect(nameInput.props('value')).toBe('test-finetune')
      expect(nameInput.props('disabled')).toBe(true)
    })

    it('应该显示集群和资源选择器', async () => {
      await wrapper.vm.fetchClusters()
      await nextTick()

      const selects = wrapper.findAllComponents({ name: 'ElSelect' })
      expect(selects.length).toBeGreaterThanOrEqual(2)
    })

    it('应该显示删除确认输入框', () => {
      const inputs = wrapper.findAllComponents({ name: 'ElInput' })
      const deleteInput = inputs.find(input => input.props('clearable'))
      expect(deleteInput).toBeDefined()
    })
  })

  // ==================== 状态控制测试 ====================
  describe('状态控制测试', () => {
    it('初始化状态下停止按钮应可用', async () => {
      await wrapper.setProps({ appStatus: 'Running' })
      await nextTick()

      expect(wrapper.vm.initialized).toBe(true)
      expect(wrapper.vm.isStopped).toBe(false)
    })

    it('已停止状态下停止按钮应禁用', async () => {
      await wrapper.setProps({ appStatus: 'Stopped' })
      await nextTick()

      expect(wrapper.vm.isStopped).toBe(true)
    })

    it('未初始化状态下重启按钮应禁用', async () => {
      await wrapper.setProps({ appStatus: 'NoAppFile' })
      await nextTick()

      expect(wrapper.vm.notInitialized).toBe(true)
    })

    it('运行中状态下重启按钮应禁用', async () => {
      await wrapper.setProps({ appStatus: 'Running' })
      await nextTick()

      expect(wrapper.vm.notInitialized).toBe(true)
    })

    it('删除按钮应在输入匹配时启用', async () => {
      wrapper.vm.delDesc = 'test-finetune/123'
      await nextTick()

      const deleteButton = wrapper.find('#confirmDelete')
      expect(deleteButton.classes()).toContain('bg-error-600')
      expect(deleteButton.classes()).toContain('cursor-pointer')
    })

    it('删除按钮应在输入不匹配时禁用', async () => {
      wrapper.vm.delDesc = 'wrong-input'
      await nextTick()

      const deleteButton = wrapper.find('#confirmDelete')
      expect(deleteButton.classes()).toContain('bg-gray-100')
    })
  })

  // ==================== 操作测试 ====================
  describe('操作测试', () => {
    it('点击停止按钮应调用stop API', async () => {
      await wrapper.vm.changeStatus('stop')

      expect(mockUseFetchApi).toHaveBeenCalledWith(
        '/models/user/model/finetune/123/stop'
      )
      expect(ElMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '更新成功',
          type: 'success'
        })
      )
    })

    it('点击重启按钮应调用start API', async () => {
      await wrapper.vm.changeStatus('start')

      expect(mockUseFetchApi).toHaveBeenCalledWith(
        '/models/user/model/finetune/123/start'
      )
      expect(ElMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '更新成功',
          type: 'success'
        })
      )
    })

    it('输入正确名称后点击删除应调用delete API', async () => {
      wrapper.vm.delDesc = 'test-finetune/123'
      await nextTick()

      await wrapper.vm.clickDelete()

      expect(mockUseFetchApi).toHaveBeenCalledWith(
        '/models/user/model/finetune/123',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' }
        })
      )
    })

    it('删除成功后应跳转到资源控制台', async () => {
      const originalLocation = window.location
      delete window.location
      window.location = { href: '' }

      wrapper.vm.delDesc = 'test-finetune/123'
      await wrapper.vm.deleteFinetune()

      await new Promise(resolve => setTimeout(resolve, 600))
      expect(window.location.href).toBe('/resource-console')

      window.location = originalLocation
    })

    it('操作成功应显示成功消息', async () => {
      await wrapper.vm.changeStatus('stop')

      expect(ElMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success'
        })
      )
    })
  })

  // ==================== 数据加载测试 ====================
  describe('数据加载测试', () => {
    it('应该加载集群列表', async () => {
      await wrapper.vm.fetchClusters()

      expect(mockUseFetchApi).toHaveBeenCalledWith('/cluster')
      expect(wrapper.vm.finetuneClusters.length).toBe(2)
    })

    it('应该根据clusterId加载资源', async () => {
      await wrapper.vm.fetchResources()

      expect(mockFetchResourcesInCategory).toHaveBeenCalledWith('cluster-1', 2)
      expect(wrapper.vm.cloudResources.length).toBeGreaterThan(0)
    })

    it('应该加载框架列表并匹配当前框架', async () => {
      wrapper.vm.cloudResources = mockResources
      await wrapper.vm.fetchFrameworks()

      expect(mockUseFetchApi).toHaveBeenCalledWith(
        expect.stringContaining('/models/user/model/runtime_framework')
      )
      expect(wrapper.vm.frameworks.length).toBeGreaterThan(0)
    })
  })

  // ==================== Computed属性测试 ====================
  describe('Computed属性测试', () => {
    it('currentResource应该返回正确的资源ID', () => {
      expect(wrapper.vm.currentResource).toBe(1)
    })

    it('currentResourceDetail应该从cloudResources中找到匹配资源', async () => {
      wrapper.vm.cloudResources = mockResources
      await nextTick()

      const detail = wrapper.vm.currentResourceDetail
      expect(detail).toBeDefined()
      expect(detail.id).toBe(1)
    })

    it('currentCid应该返回正确的集群ID', () => {
      expect(wrapper.vm.currentCid).toBe('cluster-1')
    })

    it('initialized应该正确判断初始化状态', async () => {
      const initStatuses = ['Building', 'Deploying', 'Startup', 'Running', 'Stopped']

      for (const status of initStatuses) {
        await wrapper.setProps({ appStatus: status })
        await nextTick()
        expect(wrapper.vm.initialized).toBe(true)
      }
    })

    it('notInitialized应该正确判断未初始化状态', async () => {
      await wrapper.setProps({ appStatus: 'NoAppFile' })
      await nextTick()
      expect(wrapper.vm.notInitialized).toBe(true)

      await wrapper.setProps({ appStatus: 'Running' })
      await nextTick()
      expect(wrapper.vm.notInitialized).toBe(true)
    })

    it('isStopped应该正确判断停止状态', async () => {
      await wrapper.setProps({ appStatus: 'Stopped' })
      await nextTick()
      expect(wrapper.vm.isStopped).toBe(true)

      await wrapper.setProps({ appStatus: 'Running' })
      await nextTick()
      expect(wrapper.vm.isStopped).toBe(false)
    })
  })

  // ==================== Watch测试 ====================
  describe('Watch测试', () => {
    it('clusterId变化应重新加载资源', async () => {
      mockFetchResourcesInCategory.mockClear()

      await wrapper.setProps({
        finetune: { ...mockProps.finetune, clusterId: 'cluster-2' }
      })
      await nextTick()

      expect(mockFetchResourcesInCategory).toHaveBeenCalledWith('cluster-2', 2)
    })
  })

  // ==================== 错误处理测试 ====================
  describe('错误处理测试', () => {
    it('API错误时应显示警告消息', async () => {
      mockUseFetchApi.mockImplementationOnce(() => ({
        put: () => ({
          json: () => Promise.resolve({
            data: { value: null },
            error: { value: { msg: '操作失败' } }
          })
        })
      }))

      await wrapper.vm.changeStatus('stop')

      expect(ElMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '操作失败',
          type: 'warning'
        })
      )
    })

    it('删除失败时应显示错误消息', async () => {
      mockUseFetchApi.mockImplementationOnce(() => ({
        delete: () => ({
          json: () => Promise.resolve({
            data: { value: null },
            error: { value: { msg: '删除失败' } }
          })
        })
      }))

      wrapper.vm.delDesc = 'test-finetune/123'
      await wrapper.vm.deleteFinetune()

      expect(ElMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '删除失败',
          type: 'warning'
        })
      )
    })

    it('集群加载失败时应显示错误', async () => {
      mockUseFetchApi.mockImplementationOnce(() => ({
        json: () => Promise.resolve({
          data: { value: null },
          error: { value: { msg: '加载集群失败' } }
        })
      }))

      await wrapper.vm.fetchClusters()

      expect(ElMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '加载集群失败',
          type: 'warning'
        })
      )
    })
  })

  // ==================== UI交互测试 ====================
  describe('UI交互测试', () => {
    it('鼠标悬停删除按钮应改变样式', async () => {
      wrapper.vm.delDesc = 'test-finetune/123'
      await nextTick()

      const deleteButton = wrapper.find('#confirmDelete')
      const mockElement = {
        classList: {
          replace: vi.fn()
        }
      }

      document.getElementById = vi.fn(() => mockElement)

      wrapper.vm.handleMouseOver()
      expect(mockElement.classList.replace).toHaveBeenCalledWith('bg-error-600', 'bg-error-700')
    })

    it('鼠标离开删除按钮应恢复样式', async () => {
      wrapper.vm.delDesc = 'test-finetune/123'
      await nextTick()

      const mockElement = {
        classList: {
          replace: vi.fn()
        }
      }

      document.getElementById = vi.fn(() => mockElement)

      wrapper.vm.handleMouseLeave()
      expect(mockElement.classList.replace).toHaveBeenCalledWith('bg-error-700', 'bg-error-600')
    })

    it('输入错误的删除确认文本不应触发删除', async () => {
      wrapper.vm.delDesc = 'wrong-text'
      await wrapper.vm.clickDelete()

      expect(mockUseFetchApi).not.toHaveBeenCalledWith(
        expect.stringContaining('/finetune/123')
      )
    })
  })

  // ==================== 生命周期测试 ====================
  describe('生命周期测试', () => {
    it('组件挂载时应加载集群列表', async () => {
      const fetchClustersSpy = vi.spyOn(wrapper.vm, 'fetchClusters')

      // 重新挂载组件
      const newWrapper = mount(FinetuneSettings, {
        props: mockProps,
        global: {
          stubs: {
            CsgButton: true,
            ElInput: false,
            ElSelect: false,
            ElDivider: true
          }
        }
      })

      await nextTick()

      expect(mockUseFetchApi).toHaveBeenCalledWith('/cluster')
    })

    it('有clusterId时应加载资源', async () => {
      const newWrapper = mount(FinetuneSettings, {
        props: mockProps,
        global: {
          stubs: {
            CsgButton: true,
            ElInput: false,
            ElSelect: false,
            ElDivider: true
          }
        }
      })

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockFetchResourcesInCategory).toHaveBeenCalled()
    })
  })
})
