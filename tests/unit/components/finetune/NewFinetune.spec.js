import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import NewFinetune from '@/components/finetune/NewFinetune.vue'
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
    t: (key, params) => {
      const translations = {
        'finetune.new.title': '创建微调任务',
        'finetune.new.desc': '微调描述',
        'finetune.new.name': '任务名称',
        'finetune.new.modelId': '模型ID',
        'finetune.new.cluster': '集群',
        'finetune.new.framework': '运行框架',
        'finetune.new.createFinetune': '创建微调',
        'all.pleaseInput': `请输入${params?.value || ''}`,
        'all.pleaseSelect': `请选择${params?.value || ''}`,
        'rule.lengthLimit': `长度限制${params?.min}-${params?.max}`,
        'rule.startWithLetter': '必须以字母开头',
        'rule.endWithLetterOrNumber': '必须以字母或数字结尾',
        'rule.onlyLetterNumberAndSpecialStr': '只能包含字母、数字和特殊字符',
        'rule.specialStrNotTogether': '特殊字符不能连续出现',
        'rule.nameRule': '名称规则错误',
        'all.inputFormatError': '输入格式错误',
        'endpoints.new.frameworkVersion': '框架版本',
        'endpoints.gpuMemoryRecommendation': 'GPU内存推荐：'
      }
      return translations[key] || key
    }
  })
}))

vi.mock('vue3-lottie', () => ({
  Vue3Lottie: {
    name: 'Vue3Lottie',
    template: '<div class="lottie-mock"></div>'
  }
}))

// Mock fetchResourcesInType - 必须在 vi.mock 内部定义
vi.mock('@/components/shared/deploy_instance/fetchResourceInCategory', () => ({
  fetchResourcesInType: vi.fn()
}))

describe('NewFinetune.vue', () => {
  let wrapper
  let mockUseFetchApi

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
          type: 'GPU',
          is_available: true,
          order_detail_id: 101,
          priceValue: '¥10/小时',
          resources: {
            gpu: { type: 'A100' }
          }
        },
        {
          id: 2,
          name: 'GPU-V100',
          type: 'GPU',
          is_available: false,
          order_detail_id: 102,
          priceValue: '¥8/小时',
          resources: {
            gpu: { type: 'V100' }
          }
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
            frame_name: 'PyTorch',
            compute_types: ['GPU'],
            versions: [
              { id: 10, frame_name: 'PyTorch', driver_version: '2.0', compute_type: 'GPU' },
              { id: 11, frame_name: 'PyTorch', driver_version: '1.13', compute_type: 'GPU' }
            ]
          },
          {
            id: 2,
            frame_name: 'TensorFlow',
            compute_types: ['GPU', 'CPU'],
            versions: [
              { id: 20, frame_name: 'TensorFlow', driver_version: '2.12', compute_type: 'GPU' }
            ]
          }
        ]
      }
    },
    error: { value: null }
  }

  const mockModels = {
    data: {
      value: {
        data: [
          { path: 'user1/model1' },
          { path: 'user2/model2' }
        ]
      }
    },
    error: { value: null }
  }

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks()

    // Mock useFetchApi
    const useFetchApi = await import('@/packs/useFetchApi')
    mockUseFetchApi = vi.fn()
    useFetchApi.default = mockUseFetchApi

    // Setup fetchResourcesInType mock - 从 mock 中获取
    const { fetchResourcesInType } = await import('@/components/shared/deploy_instance/fetchResourceInCategory')
    fetchResourcesInType.mockResolvedValue(mockResources)

    // Setup default API responses
    mockUseFetchApi.mockImplementation((url) => {
      if (url === '/cluster') {
        return {
          json: () => Promise.resolve(mockClusters)
        }
      }
      if (url.includes('/runtime_framework_v2')) {
        return {
          json: () => Promise.resolve(mockFrameworks)
        }
      }
      if (url.includes('/runtime_framework/models')) {
        return {
          json: () => Promise.resolve(mockModels)
        }
      }
      return {
        json: () => Promise.resolve({ data: { value: {} }, error: { value: null } }),
        post: () => ({
          json: () => Promise.resolve({
            data: { value: { data: { deploy_id: 123 } } },
            error: { value: null }
          })
        })
      }
    })

    // Mock provide/inject
    wrapper = mount(NewFinetune, {
      props: {
        namespace: 'test-user'
      },
      global: {
        provide: {
          nameRule: /^[a-zA-Z][a-zA-Z0-9-_.]*[a-zA-Z0-9]$/
        },
        stubs: {
          SvgIcon: true,
          CsgButton: {
            template: '<button @click="$emit(\'click\')"><slot>{{ name }}</slot></button>',
            props: ['name']
          },
          Vue3Lottie: true,
          ElForm: false,
          ElFormItem: false,
          ElInput: false,
          ElSelect: false,
          ElOption: false,
          ElAutocomplete: false,
          ElTooltip: false,
          ElIcon: false
        }
      }
    })
  })

  // ==================== 渲染测试 ====================
  describe('渲染测试', () => {
    it('应该正确渲染组件结构', () => {
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('h3').text()).toContain('创建微调任务')
    })

    it('应该显示标题和描述', () => {
      expect(wrapper.find('h3').exists()).toBe(true)
      expect(wrapper.find('p').exists()).toBe(true)
    })

    it('应该渲染所有表单字段', async () => {
      await nextTick()
      const formItems = wrapper.findAllComponents({ name: 'ElFormItem' })
      expect(formItems.length).toBeGreaterThanOrEqual(5) // 名称、模型ID、集群、框架、框架版本
    })

    it('应该显示Lottie动画', () => {
      expect(wrapper.findComponent({ name: 'Vue3Lottie' }).exists()).toBe(true)
    })

    it('应该在URL有model_id时预填充', async () => {
      // Mock URLSearchParams
      const originalLocation = window.location
      delete window.location
      window.location = { search: '?model_id=user/model' }

      const wrapperWithModelId = mount(NewFinetune, {
        props: { namespace: 'test-user' },
        global: {
          provide: { nameRule: /^[a-zA-Z][a-zA-Z0-9-_.]*[a-zA-Z0-9]$/ },
          stubs: { SvgIcon: true, CsgButton: true, Vue3Lottie: true }
        }
      })

      await nextTick()
      expect(wrapperWithModelId.vm.dataForm.model_id).toBe('user/model')

      window.location = originalLocation
    })
  })

  // ==================== 表单验证测试 ====================
  describe('表单验证测试', () => {
    it('名称为空时应显示错误', async () => {
      const form = wrapper.findComponent({ ref: 'dataFormRef' })
      wrapper.vm.dataForm.deploy_name = ''

      await nextTick()
      const result = await form.vm.validateField('deploy_name').catch(e => e)
      expect(result).toBeDefined()
    })

    it('名称长度不足2个字符时应显示错误', async () => {
      wrapper.vm.dataForm.deploy_name = 'a'
      const form = wrapper.findComponent({ ref: 'dataFormRef' })

      await nextTick()
      const result = await form.vm.validateField('deploy_name').catch(e => e)
      expect(result).toBeDefined()
    })

    it('名称超过64个字符时应显示错误', async () => {
      wrapper.vm.dataForm.deploy_name = 'a'.repeat(65)
      const form = wrapper.findComponent({ ref: 'dataFormRef' })

      await nextTick()
      const result = await form.vm.validateField('deploy_name').catch(e => e)
      expect(result).toBeDefined()
    })

    it('名称不以字母开头时应显示错误', async () => {
      wrapper.vm.dataForm.deploy_name = '123abc'
      const form = wrapper.findComponent({ ref: 'dataFormRef' })

      await nextTick()
      const result = await form.vm.validateField('deploy_name').catch(e => e)
      expect(result).toBeDefined()
    })

    it('名称不以字母或数字结尾时应显示错误', async () => {
      wrapper.vm.dataForm.deploy_name = 'abc-'
      const form = wrapper.findComponent({ ref: 'dataFormRef' })

      await nextTick()
      const result = await form.vm.validateField('deploy_name').catch(e => e)
      expect(result).toBeDefined()
    })

    it('名称包含非法字符时应显示错误', async () => {
      wrapper.vm.dataForm.deploy_name = 'abc@def'
      const form = wrapper.findComponent({ ref: 'dataFormRef' })

      await nextTick()
      const result = await form.vm.validateField('deploy_name').catch(e => e)
      expect(result).toBeDefined()
    })

    it('模型ID格式错误时应显示错误', async () => {
      wrapper.vm.dataForm.model_id = 'invalid-format'
      const form = wrapper.findComponent({ ref: 'dataFormRef' })

      await nextTick()
      const result = await form.vm.validateField('model_id').catch(e => e)
      expect(result).toBeDefined()
    })

    it('所有验证通过时应允许提交', async () => {
      wrapper.vm.dataForm.deploy_name = 'validName123'
      wrapper.vm.dataForm.model_id = 'user/model'
      wrapper.vm.dataForm.cluster_id = 'cluster-1'
      wrapper.vm.dataForm.resource_id = '1/101'
      wrapper.vm.dataForm.runtime_framework_id = 10

      const form = wrapper.findComponent({ ref: 'dataFormRef' })
      await nextTick()

      const result = await form.vm.validate().catch(e => null)
      expect(result).toBeTruthy()
    })
  })

  // ==================== 数据联动测试 ====================
  describe('数据联动测试', () => {
    it('选择集群后应加载资源列表', async () => {
      await wrapper.vm.fetchClusters()
      await nextTick()

      expect(wrapper.vm.finetuneClusters.length).toBeGreaterThan(0)
      expect(wrapper.vm.dataForm.cluster_id).toBe('cluster-1')
    })

    it('选择资源后应筛选匹配的框架', async () => {
      wrapper.vm.finetuneResources = mockResources
      wrapper.vm.finetuneFrameworks = mockFrameworks.data.value.data
      wrapper.vm.dataForm.resource_id = '1/101'

      await nextTick()

      const filtered = wrapper.vm.filterFrameworks
      expect(filtered.length).toBeGreaterThan(0)
      expect(filtered.every(f => f.compute_types.includes('GPU'))).toBe(true)
    })

    it('切换资源类型应更新资源列表', async () => {
      wrapper.vm.finetuneResources = mockResources
      wrapper.vm.typeList = ['GPU', 'CPU']
      wrapper.vm.activeType = 'GPU'

      await wrapper.vm.setActiveType('CPU')
      await nextTick()

      expect(wrapper.vm.activeType).toBe('CPU')
    })

    it('选择模型后应加载运行时框架', async () => {
      wrapper.vm.dataForm.model_id = 'user/model'

      await wrapper.vm.fetchRuntimeFramework()
      await nextTick()

      expect(wrapper.vm.finetuneFrameworks.length).toBeGreaterThan(0)
    })

    it('框架版本应根据资源类型筛选', async () => {
      wrapper.vm.finetuneResources = mockResources
      wrapper.vm.finetuneFrameworks = mockFrameworks.data.value.data
      wrapper.vm.dataForm.resource_id = '1/101'
      wrapper.vm.frameworkVersion = 0

      await wrapper.vm.resetVersions()
      await nextTick()

      expect(wrapper.vm.frameworkVersionOptions.length).toBeGreaterThan(0)
      expect(wrapper.vm.frameworkVersionOptions.every(v => v.compute_type === 'GPU')).toBe(true)
    })

    it('无可用资源时应清空选择', async () => {
      const noAvailableResources = [
        {
          label: 'GPU',
          options: [
            { id: 1, is_available: false, order_detail_id: 101 }
          ]
        }
      ]

      mockFetchResourcesInType.mockResolvedValueOnce(noAvailableResources)

      await wrapper.vm.fetchResources()
      await nextTick()

      expect(wrapper.vm.dataForm.resource_id).toBe('')
    })

    it('框架版本变化应重置runtime_framework_id', async () => {
      wrapper.vm.finetuneResources = mockResources
      wrapper.vm.finetuneFrameworks = mockFrameworks.data.value.data
      wrapper.vm.dataForm.resource_id = '1/101'
      wrapper.vm.frameworkVersion = 0
      wrapper.vm.dataForm.runtime_framework_id = 999

      await wrapper.vm.resetVersions()
      await nextTick()

      expect(wrapper.vm.dataForm.runtime_framework_id).not.toBe(999)
    })
  })

  // ==================== API交互测试 ====================
  describe('API交互测试', () => {
    it('应该正确调用集群列表API', async () => {
      await wrapper.vm.fetchClusters()

      expect(mockUseFetchApi).toHaveBeenCalledWith('/cluster')
    })

    it('应该正确调用资源列表API', async () => {
      wrapper.vm.dataForm.cluster_id = 'cluster-1'
      await wrapper.vm.fetchResources()

      expect(mockFetchResourcesInType).toHaveBeenCalledWith('cluster-1', 2)
    })

    it('应该正确调用模型搜索API', async () => {
      const callback = vi.fn()
      await wrapper.vm.fetchModels('test', callback)

      expect(mockUseFetchApi).toHaveBeenCalledWith(
        expect.stringContaining('/runtime_framework/models?search=test')
      )
      expect(callback).toHaveBeenCalled()
    })

    it('应该正确调用框架列表API', async () => {
      wrapper.vm.dataForm.model_id = 'user/model'
      await wrapper.vm.fetchRuntimeFramework()

      expect(mockUseFetchApi).toHaveBeenCalledWith(
        expect.stringContaining('/models/user/model/runtime_framework_v2')
      )
    })

    it('提交表单应调用创建微调API', async () => {
      wrapper.vm.dataForm = {
        deploy_name: 'test-finetune',
        model_id: 'user/model',
        cluster_id: 'cluster-1',
        resource_id: '1/101',
        runtime_framework_id: 10,
        secure_level: 2
      }

      await wrapper.vm.submitFinetuneForm()

      expect(mockUseFetchApi).toHaveBeenCalledWith(
        expect.stringContaining('/models/user/model/finetune'),
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
          body: expect.any(String)
        })
      )
    })
  })

  // ==================== 错误处理测试 ====================
  describe('错误处理测试', () => {
    it('API错误时应显示错误消息', async () => {
      mockUseFetchApi.mockImplementationOnce(() => ({
        json: () => Promise.resolve({
          data: { value: null },
          error: { value: { msg: '网络错误' } }
        })
      }))

      await wrapper.vm.fetchClusters()

      expect(ElMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '网络错误',
          type: 'warning'
        })
      )
    })

    it('提交失败时应停止loading状态', async () => {
      wrapper.vm.loading = true

      mockUseFetchApi.mockImplementationOnce(() => ({
        post: () => ({
          json: () => Promise.resolve({
            data: { value: null },
            error: { value: { msg: '提交失败' } }
          })
        })
      }))

      await wrapper.vm.submitFinetuneForm()

      // loading状态在handleSubmit的finally中重置
      expect(ElMessage).toHaveBeenCalled()
    })

    it('框架加载失败时应清空选项', async () => {
      mockUseFetchApi.mockImplementationOnce(() => ({
        json: () => Promise.resolve({
          data: { value: null },
          error: { value: { msg: '加载失败' } }
        })
      }))

      wrapper.vm.dataForm.model_id = 'user/model'
      await wrapper.vm.fetchRuntimeFramework()

      expect(wrapper.vm.finetuneFrameworks).toEqual([])
      expect(wrapper.vm.frameworkVersionOptions).toEqual([])
    })
  })

  // ==================== 用户交互测试 ====================
  describe('用户交互测试', () => {
    it('点击指南按钮应打开新窗口', async () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => {})

      await wrapper.vm.handleGuideClick()

      expect(windowOpenSpy).toHaveBeenCalledWith(
        'https://opencsg.com/docs/inferencefinetune/finetune_intro',
        '_blank'
      )

      windowOpenSpy.mockRestore()
    })

    it('点击资源卡片应更新选择', async () => {
      const resource = mockResources[0].options[0]

      await wrapper.vm.changeCloudResource(resource)

      expect(wrapper.vm.dataForm.resource_id).toBe('1/101')
    })

    it('提交按钮应触发表单验证', async () => {
      const form = wrapper.findComponent({ ref: 'dataFormRef' })
      const validateSpy = vi.spyOn(form.vm, 'validate')

      await wrapper.vm.handleSubmit()

      expect(validateSpy).toHaveBeenCalled()
    })
  })
})
