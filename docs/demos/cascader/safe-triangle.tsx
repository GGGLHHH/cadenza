import type { CascaderNode } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import { Cascader } from '@gedatou/cadenza-ui'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// 可视化子菜单的悬停意图判定(亚马逊导航出名的「安全三角形」):光标与已打开
// 子面板近边两角围成的三角形内,斜向掠过兄弟项不会切走子菜单。真实实现是
// Base UI 内置的 Floating UI safePolygon(动态多边形),这里画的是教学近似。
const REGIONS: CascaderNode[] = [
  {
    value: 'zhejiang',
    label: '浙江',
    items: [
      {
        value: 'hangzhou',
        label: '杭州',
        items: [
          { value: 'xihu', label: '西湖区' },
          { value: 'binjiang', label: '滨江区' },
          { value: 'yuhang', label: '余杭区' },
        ],
      },
      {
        value: 'ningbo',
        label: '宁波',
        items: [
          { value: 'haishu', label: '海曙区' },
          { value: 'yinzhou', label: '鄞州区' },
        ],
      },
      {
        value: 'wenzhou',
        label: '温州',
        items: [
          { value: 'lucheng', label: '鹿城区' },
          { value: 'ouhai', label: '瓯海区' },
        ],
      },
      {
        value: 'shaoxing',
        label: '绍兴',
        items: [
          { value: 'yuecheng', label: '越城区' },
          { value: 'keqiao', label: '柯桥区' },
        ],
      },
      {
        value: 'jinhua',
        label: '金华',
        items: [
          { value: 'wucheng', label: '婺城区' },
          { value: 'yiwu', label: '义乌市' },
        ],
      },
    ],
  },
  {
    value: 'jiangsu',
    label: '江苏',
    items: [
      {
        value: 'nanjing',
        label: '南京',
        items: [
          { value: 'xuanwu', label: '玄武区' },
          { value: 'gulou', label: '鼓楼区' },
        ],
      },
      {
        value: 'suzhou',
        label: '苏州',
        items: [
          { value: 'gusu', label: '姑苏区' },
          { value: 'wuzhong', label: '吴中区' },
        ],
      },
      {
        value: 'wuxi',
        label: '无锡',
        items: [
          { value: 'liangxi', label: '梁溪区' },
          { value: 'binhu', label: '滨湖区' },
        ],
      },
      {
        value: 'nantong',
        label: '南通',
        items: [
          { value: 'chongchuan', label: '崇川区' },
          { value: 'tongzhou', label: '通州区' },
        ],
      },
    ],
  },
  {
    value: 'guangdong',
    label: '广东',
    items: [
      {
        value: 'guangzhou',
        label: '广州',
        items: [
          { value: 'tianhe', label: '天河区' },
          { value: 'yuexiu', label: '越秀区' },
        ],
      },
      {
        value: 'shenzhen',
        label: '深圳',
        items: [
          { value: 'nanshan', label: '南山区' },
          { value: 'futian', label: '福田区' },
        ],
      },
      {
        value: 'foshan',
        label: '佛山',
        items: [
          { value: 'chancheng', label: '禅城区' },
          { value: 'shunde', label: '顺德区' },
        ],
      },
    ],
  },
  {
    value: 'fujian',
    label: '福建',
    items: [
      {
        value: 'fuzhou',
        label: '福州',
        items: [
          { value: 'gulou-fz', label: '鼓楼区' },
          { value: 'taijiang', label: '台江区' },
        ],
      },
      {
        value: 'xiamen',
        label: '厦门',
        items: [
          { value: 'siming', label: '思明区' },
          { value: 'huli', label: '湖里区' },
        ],
      },
    ],
  },
]

// 光标到子面板矩形最近一条边的两个端点(级联面板向侧面展开,常态命中左右边)。
function nearEdge(x: number, y: number, rect: DOMRect): [string, string] {
  if (x <= rect.left)
    return [`${rect.left},${rect.top}`, `${rect.left},${rect.bottom}`]
  if (x >= rect.right)
    return [`${rect.right},${rect.top}`, `${rect.right},${rect.bottom}`]
  if (y <= rect.top)
    return [`${rect.left},${rect.top}`, `${rect.right},${rect.top}`]
  return [`${rect.left},${rect.bottom}`, `${rect.right},${rect.bottom}`]
}

// 面板包含判定的余量(px):兄弟面板之间可能有几像素缝隙,斜线跨缝时不断线。
const containsPad = 8

export default function SafeTriangleDemo(): ReactElement {
  const [points, setPoints] = useState<string | null>(null)
  const anchorRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let lastX = 0
    let lastY = 0
    let seen = false
    let frame = 0

    function contains(rect: DOMRect, pad: number): boolean {
      return lastX >= rect.left - pad && lastX <= rect.right + pad
        && lastY >= rect.top - pad && lastY <= rect.bottom + pad
    }

    function update(): void {
      if (!seen)
        return
      // DOM 顺序就是打开链:根 → 子 → 孙。斜线只存在于「光标在第 i 层
      // 面板内、奔向第 i+1 层」这一种姿态——光标不在链上任何面板内
      // (整个离开了菜单)或已在最深一层,都没有要保护的目标。只收
      // data-open 的弹层:退场动画期间旧弹层仍在 DOM 里,不能再当目标。
      // 弹层 portal 到 body,同页别的 Cascader demo 的弹层也会被全局查询
      // 抓到——靠 aria-labelledby 认亲:根弹层指回本实例的 trigger,
      // 子弹层指向父面板里的分支项,不在链上的一律跳过。
      const trigger = anchorRef.current?.querySelector('[data-slot="cascader-trigger"]')
      const chain: Element[] = []
      for (const popup of document.querySelectorAll(
        '[data-slot="cascader-popup"][data-open], [data-slot="cascader-submenu-popup"][data-open]',
      )) {
        const labelId = popup.getAttribute('aria-labelledby')
        const label = labelId === null ? null : document.getElementById(labelId)
        if (label === null)
          continue
        if (chain.length === 0 ? label === trigger : chain[chain.length - 1].contains(label))
          chain.push(popup)
      }
      const rects = chain.map(popup => popup.getBoundingClientRect())
      // 光标真正落在的最深一层:钻取是向前的,面板边界重叠时深层赢——
      // 取最浅会把刚跨进子面板的光标判回父层,目标变成脚下这块面板。
      let index = rects.findLastIndex(rect => contains(rect, 0))
      // 不真在任何面板内 = 可能正跨面板间几像素的缝:宽容判定取最浅命中,
      // 视作仍在出发面板,目标不变,斜线跨缝不闪断。
      if (index === -1)
        index = rects.findIndex(rect => contains(rect, containsPad))
      const target = index === -1 ? undefined : rects[index + 1]
      // 光标已在目标内部 = 已经到了,没有斜线可保护;此守卫同时封死
      // nearEdge 对内部点的退化兜底(罩住整块面板的底边三角形)。
      if (target !== undefined && !contains(target, 0)) {
        const [a, b] = nearEdge(lastX, lastY, target)
        setPoints(`${lastX},${lastY} ${a} ${b}`)
        // 显示期间每帧跟随:弹层挂载后 Floating UI 还可能再调整定位/尺寸,
        // 那只是 style 变更,指针和 childList 都不报信。points 没变时
        // setState 同值 bail out,不产生重渲染;无目标时循环自然停。
        frame = requestAnimationFrame(update)
        return
      }
      setPoints(null)
    }

    // 测量统一推迟到下一帧:弹层刚挂载时 Floating UI 的定位还没落地,
    // 那一刻量到的矩形停在视口 (0,0),同步重算会画出指向左上角的三角形。
    // rAF 在定位就绪之后、绘制之前跑,顺带把连续 pointermove 合并成每帧一次。
    function schedule(): void {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }

    function handleMove(event: PointerEvent): void {
      lastX = event.clientX
      lastY = event.clientY
      seen = true
      schedule()
    }

    // 子面板超时自关或选中关闭时没有指针事件,残留要靠 DOM 信号清:
    // 弹层关闭即从 body 卸载,childList 变更就是重算时机。
    const observer = new MutationObserver(schedule)
    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('pointermove', handleMove, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('pointermove', handleMove)
    }
  }, [])

  return (
    <>
      {/* display:contents 的锚点只为拿到本实例 trigger,不参与布局 */}
      <span className="contents" ref={anchorRef}>
        <Cascader aria-label="地区" defaultOpen items={REGIONS} placeholder="悬停分支,斜向移入子面板" />
      </span>
      {points !== null && createPortal(
        <svg
          aria-hidden
          className="
            pointer-events-none fixed inset-0 z-50 block-full inline-full
          "
        >
          <polygon
            className="fill-primary/10 stroke-primary/50"
            points={points}
            strokeDasharray="4 4"
            strokeWidth={1.5}
          />
        </svg>,
        document.body,
      )}
    </>
  )
}
