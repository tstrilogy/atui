<template>
  <div :class="[prefixCls + '-tab-wrapper']">
    <div :class="[prefixCls + '-tab-header']">
      <span v-if="renderData.length > showLen && showLen >= 3" :class="[prefixCls + '-tab-arrow-prev']" @click="prev">
        <icon v-if="prev_tabIndex==0" type="prev" size="12" color="#ccc" style="cursor: not-allowed"></icon>
        <icon v-else type="prev" size="12"></icon>
      </span>
      <ul v-if="trigger=='click'" :class="listClassObj" role="tablist">
        <li v-for="(r, index) in renderData"
            :class="[index === currActive && (prefixCls + '-nav-active'), r.disabled && (prefixCls + '-nav-disabled')]"
            @click.prevent="handleTabListClick(index, r)"
            :disabled="r.disabled"
        >
            <a v-if="r.customHeader" v-html="r.customHeader"></a>
            <a v-else href="javascript:void(0);" v-html="r.header"></a>
        </li>
      </ul>
      <ul v-else :class="listClassObj" role="tablist">
      <li v-for="(r, index) in renderData"
            :class="[index === currActive && (prefixCls + '-nav-active'), r.disabled && (prefixCls + '-nav-disabled')]"
            @mouseenter.prevent="handleTabListClick(index, r)"
            :disabled="r.disabled"
        >
            <a href="javascript:void(0);" v-html="r.header"></a>
        </li>
      </ul>
      <span v-if="renderData.length > showLen && showLen >= 3" :class="[prefixCls + '-tab-arrow-next']" @click="next">
        <icon v-if="next_tabIndex == maxTabIndex" type="next" size="12" color="#ccc" style="cursor: not-allowed"></icon>
        <icon v-else type="next" size="12"></icon>
      </span>
    </div>

     <!-- Tab panes -->
     <div class="tab-content" ref="tabContent">
        <slot></slot>
     </div>
  </div>

</template>

<script type="text/babel">
import Vue from 'vue'
import Icon from '../Icon/'

export default {
  name: 'Tabset',
  props: {
    active: {
      type: Number,
      default: 0
    },
    headers: {
      type: Array,
      default: function () {
        return []
      }
    },
    showLen: {
      type: Number,
      default: 6
    },
    base: {
      type: Boolean
    },
    trigger: {
      type: String,
      default: 'click'
    },
    size: {
      type: String,
      default: 'default'
    },
    prefixCls: {
      type: String,
      default: 'atui'
    }
  },

  data () {
    return {
      renderData: [],
      index: 2,
      currActive: this.active,
      translateX: 0,
      wrapperWidth: 0,
      navWidth: 0,
      prev_tabIndex: 0,
      next_tabIndex: 0,
      itemsWidth: [],
      maxTabIndex: 0
    }
  },
  components: {
    Icon
  },
  computed: {
    listClassObj () {
      let { prefixCls, base, size } = this
      let classObj = {}

      classObj[prefixCls + '-nav'] = true
      classObj[prefixCls + '-nav-tab'] = !base
      classObj[prefixCls + '-nav-base'] = base
      classObj[prefixCls + '-nav-small'] = size === 'small'

      return classObj
    }
  },
  watch: {
    active (newVal, oldVal) {
      this.currActive = newVal
    },
    currActive (newVal, oldVal) {
      this.$emit('change', newVal)
    },
    headers () {
      let me = this
      Vue.nextTick(function () {
        me.renderData = me.$children.map((child, index) => {
          return {
            header: child.header,
            disabled: child.disabled
          }
        })
      })
    }
  },
  methods: {
    handleTabListClick (index, el) {
      if (!el.disabled) this.currActive = index
      this.$emit('on-tab-click', this.currActive)
    },
    prev () {
      this._handleMoveX('right')
    },
    next () {
      this._handleMoveX('left')
    },
    _handleMoveX (direction) {
      const totalLen = this.renderData.length
      const prefixCls = this.prefixCls

      switch (direction) {
        case 'left':
          /**
           * 这里需要计算maxTabIndex, 本身Tab的最大index应该是totalLen-1，但是为了后面的Tab宽度太宽，需要将最大的index增加（this.showLen-1）, 也就是让整个nav再多向左移动这些次，以让每一个Tab的内容都能显示清楚。
           *
           * 如果能保证每一个tab的内容长度都不会太长并且差不多长，那么此时maxTabIndex可以等于totalLen-1
           *
           */
          let maxTabIndex = totalLen - 1 + (this.showLen - 1)
          this.maxTabIndex = maxTabIndex
          if (this.next_tabIndex === maxTabIndex) return
          this.prev_tabIndex++
          this.next_tabIndex = this.prev_tabIndex + this.showLen - 1
          break
        case 'right':
          if (this.prev_tabIndex === 0) return
          this.next_tabIndex--
          this.prev_tabIndex = this.next_tabIndex - (this.showLen - 1)
          break
      }
      this.$el.querySelector('.' + prefixCls + '-nav').style.transform = 'translateX(-" + this.itemsWidth[this.prev_tabIndex].left + "px)'
    },
    _handleTabWidth () {
      const self = this
      const dom = self.$el
      const prefixCls = self.prefixCls
      const nav = dom.querySelector('.' + prefixCls + '-nav')
      // const tabsHeader = dom.querySelector('.' + prefixCls + '-tab-header')
      const list = nav.children
      const showlen = this.showLen
      const len = list.length
      self.next_tabIndex = showlen - 1

      let i = 0
      for (; i < len; i++) {
        const _itemWidth = Math.ceil(list[i].offsetWidth)
        self.navWidth += _itemWidth
        self.itemsWidth.push({ width: _itemWidth, left: self.navWidth - _itemWidth })
        if (i < showlen) {
          self.wrapperWidth += _itemWidth
        }
      }
      // modify By ruohuan 宽度不需要设置，默认100%就好，特殊场景业务，业务自己处理
      // tabsHeader.style.width = self.wrapperWidth + 'px'
      self.$el.style.visibility = 'visible'
    }
  },
  mounted () {
    this.$el.style.visibility = 'hidden'
    const self = this
    /**
     * 动态去设置容器tabsWrapper的宽度以及内部nav的宽度，以便让它不溢出，类似于轮播图。
     * 这里需要用setTimeout函数，否则获取不到dom节点。
     */
    setTimeout(() => {
      self._handleTabWidth()
    }, 30)
  }
}
</script>
