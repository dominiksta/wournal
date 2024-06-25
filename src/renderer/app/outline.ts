import { Component, h, rx, style, TemplateElementChild } from '@mvui/core';
import * as ui5 from '@mvui/ui5';
import { BasicDialogManagerContext } from 'common/dialog-manager';
import { OutlineNode } from 'persistence/DocumentMeta';
import { DSUtils } from 'util/DSUtils';
import { ApiCtx } from 'app/api-context';
import { DocumentCtx } from 'app/document-context';
import { GlobalCommandsCtx } from './global-commands';
import { customScrollbar } from 'global-styles';

@Component.register
export class OutlineContainer extends Component {

  private readonly outlineRef = this.ref<Outline>();
  public add() { this.outlineRef.current.add() }

  render() {
    const editMode = new rx.State(false, 'OutlineContainer:editMode');
    const globalCmds = this.getContext(GlobalCommandsCtx);

    return [
      h.section({ fields: { id: 'container' }}, [
        h.div({ fields: { id: 'title'}}, [
          h.span('Outline'),
          ui5.button({
            fields: {
              icon: 'close-command-field',
              tooltip: `Close (${globalCmds.bookmark_display_toggle.shortcut})`,
              design: 'Transparent'
            },
            events: { click: _ => { globalCmds.bookmark_display_toggle.func() }}
          }),
        ]),

        Outline.t({
          ref: this.outlineRef,
          props: { editMode },
          fields: { id: 'outline' }
        }),

        h.section({ fields: { id: 'control' }}, [
          ui5.button({
            fields: {
              icon: 'bookmark-2', design: 'Transparent',
              tooltip: `Add Bookmark (${globalCmds.bookmark_add.shortcut})`
            },
            events: {
              click: _ => {
                this.outlineRef.current.add();
              }
            }
          }, 'Add'),
          // ui5.button({ fields: { icon: 'edit', design: 'Transparent' }}, 'Add'),
          // ui5.switchToggle({ fields: { id: 'edit' }, style: { verticalAlign: 'bottom' }}),
          ui5.toggleButton(
            {
              fields: {
                icon: 'edit', pressed: editMode,
                design: editMode.ifelse({ if: 'Attention', else: 'Transparent' }),
                tooltip: 'Edit Bookmarks',
              },
              events: {
                click: _ => {
                  editMode.next(e => !e);
                }
              }
            }, editMode.ifelse({ if: 'Done', else: 'Edit' })),
        ]),
      ])
    ]
  }

  static styles = style.sheet({
    ...customScrollbar,
    '#title': {
      // margin: '.5em',
      display: 'grid',
      gridTemplateColumns: 'auto 3em',
      alignItems: 'center',
      margin: '.5em 0 .5em .5em',
      // width: '100%',
    },
    '#title ui5-button': {
      justifySelf: 'end',
    },
    '#outline': {
      height: 'auto',
      flexGrow: '1',
    },
    '#control': {
      margin: '.5em',
    },
    '#container': {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    },
    ':host': {
      userSelect: 'none',
      display: 'block',
      minWidth: '200px',
      height: '100%',
      backgroundColor: ui5.Theme.BaseColor,
    }
  })
}

@Component.register
class Outline extends Component {
  props = {
    editMode: rx.prop<boolean>(),
  }

  public add: () => void; // hackity hack hack

  render() {
    const { editMode } = this.props;
    const doc = this.getContext(DocumentCtx);
    const outline = new rx.State<OutlineNode[]>([], 'Outline:outline');

    {
      // HACK: maybe we want a "synchronous switchmap" in mvui?
      this.subscribe(doc.pipe(rx.switchMap(d => d.meta)), m => {
        if (m.outline === outline.value) return;
        outline.next(m.outline)
      });
      this.subscribe(outline, outline => {
        doc.value.meta.next(m => ({ ...m, outline }));
      });
    }

    const dialog = this.getContext(BasicDialogManagerContext);
    const api = this.getContext(ApiCtx);

    const focus = new rx.State<{
      o: OutlineNode, el: ui5.types.TreeItemCustom
    } | false>(false, 'Outline:focus');
    const focusIsFirst = focus.derive(f => {
      if (f === false) return true;
      return getOutlineCtx(f.o).selfChildren.indexOf(f.o) === 0;
    });
    const focusIsTopLevel = focus.derive(f => {
      if (f === false) return true;
      return getOutlineCtx(f.o).parent === false;
    });

    const getOutlineCtx = (o: OutlineNode) => {
      const _getOutlineCtx = (
        head: OutlineNode[], o: OutlineNode, parent: OutlineNode | false
      ): { selfChildren: OutlineNode[], parent: OutlineNode | false } | false => {
        if (head.indexOf(o) !== -1) return { selfChildren: head, parent };
        for (const el of head) {
          const attempt = _getOutlineCtx(el.children, o, el);
          if (attempt) return attempt;
        }
        return false;
      };

      const ret = _getOutlineCtx(outline.value, o, false);
      if (ret === false)
        throw new Error(`Could not find children arr for node: ${JSON.stringify(o)}`);
      return ret
    }

    const treeRef = this.ref<ui5.types.Tree>();
    const outlineField = '__outline__';

    const findElForOutlineNode = (o: OutlineNode): ui5.types.TreeItemCustom => {
      if (!treeRef.current) throw new Error('Could not find outline element');
      const candidates = treeRef.current.querySelectorAll<ui5.types.TreeItemCustom>(
        'ui5-tree-item-custom'
      );
      for (const candidate of candidates) {
        if ((candidate as any)[outlineField] === o) return candidate;
      }
      throw new Error('Could not find outline element');
    }

    const move = (
      o: OutlineNode,
      direction: 'up' | 'down' | 'left' | 'right'
    ) => {
      const ctx = getOutlineCtx(o);
      const idx = ctx.selfChildren.indexOf(o);
      if (direction === 'up') {
        DSUtils.moveInArr(ctx.selfChildren, idx, Math.max(0, idx - 1));
      } else if (direction === 'down') {
        DSUtils.moveInArr(ctx.selfChildren, idx, idx + 1);
      } else if (direction === 'right') {
        if (idx === 0) return;
        ctx.selfChildren.splice(idx, 1);
        ctx.selfChildren[idx-1].children.push(o);
        ctx.selfChildren[idx-1].expanded = true;
      } else if (direction === 'left') {
        if (ctx.parent === false) return;
        ctx.selfChildren.splice(idx, 1);
        const parentArr = getOutlineCtx(ctx.parent).selfChildren;
        parentArr.push(o);
        DSUtils.moveInArr(
          parentArr,
          parentArr.length - 1,
          parentArr.indexOf(ctx.parent) + 1
        );
      }
      outline.next(o => o);
      requestAnimationFrame(() => { findElForOutlineNode(o).focus() });
    }

    const rename = async (o: OutlineNode) => {
      const resp = await dialog.promptInput('Rename Bookmark');
      if (!resp) return;
      o.title = resp;
      outline.next(o => o);
      requestAnimationFrame(() => { findElForOutlineNode(o).focus() });
    }

    const remove = async (o: OutlineNode) => {
      if (!(await dialog.promptYesOrNo(
        'Delete Bookmark?',
        `Are you sure you want to delete the bookmark "${o.title}"?`
      ))) return;
      const arr = getOutlineCtx(o).selfChildren;
      const idx = arr.indexOf(o);
      arr.splice(arr.indexOf(o), 1);
      outline.next(o => o);
      if (arr.length !== 0)
        requestAnimationFrame(() => {
          findElForOutlineNode(arr[Math.max(0, idx - 1)]).focus()
        });
    }

    this.add = async () => {
      const pageNr = api.getCurrentPageNr();
      const title = await dialog.promptInput('Add Bookmark');
      if (!title) return;
      const newO: OutlineNode = { title, pageNr, expanded: false, children: [] };
      if (outline.value.length === 0 || !focus.value) {
        outline.next(o => [ ...o, newO]);
      } else {
        const o = focus.value.o;
        const arr = getOutlineCtx(o).selfChildren;
        arr.push(newO);
        DSUtils.moveInArr(arr, arr.length - 1, arr.indexOf(o) + 1);
        outline.next(o => o);
      }
      requestAnimationFrame(() => {
        focus.next({ o: newO, el: findElForOutlineNode(newO) });
      });
    }

    const mkOutlineTemplate = (o: OutlineNode): TemplateElementChild => {
      return ui5.treeItemCustom({
        slots: {
          content: h.div({ fields: { className: 'outline-text' }}, [
            h.span({ fields: { className: 'outline-title', innerText: o.title }}),
            h.span({ fields: { className: 'outline-page-nr' }}, o.pageNr.toString()),
          ])
        },
        fields: {
          expanded: o.expanded,
          [outlineField]: o,
        } as any,
        events: {
          'click': e => {
            console.log(`outline click ${o.title}`);
            api.scrollPage(o.pageNr);
            findElForOutlineNode(o).focus();
            e.stopPropagation();
          },
          'focusin': e => {
            focus.next({ o, el: e.target as ui5.types.TreeItemCustom })
            e.stopPropagation();
          },
          'keyup': e => {
            if (e.key === ' ' || e.key === 'Enter') api.scrollPage(o.pageNr);
            if (e.key === 'Delete') remove(o);
            if (e.key === 'F2') rename(o);
            if (e.shiftKey) {
              if (e.key === 'ArrowLeft')  move(o, 'left');
              if (e.key === 'ArrowUp')    move(o, 'up');
              if (e.key === 'ArrowDown')  move(o, 'down');
              if (e.key === 'ArrowRight') move(o, 'right');
            }
            e.stopPropagation();
          },
        }
      }, o.children.map(mkOutlineTemplate))
    };

    return [
      h.section(
        {
          events: {
            // 'focusout': _ => { if (focus.value !== false) focus.next(false) },
          }
        },
        [
          h.section(
            {
              style: {
                display: editMode.ifelse({ if: 'inline-block', else: 'none' }),
              },
            },
            [
              ui5.button({
                fields: {
                  icon: 'text',
                  design: 'Transparent',
                  tooltip: 'Rename (F2)',
                  disabled: focus.derive(f => f === false)
                },
                events: {
                  click: _ => { if (focus.value !== false) rename(focus.value.o) },
                }
              }),
              ui5.button({
                fields: {
                  icon: 'delete',
                  design: 'Transparent',
                  tooltip: 'Delete (DEL)',
                  disabled: focus.derive(f => f === false)
                },
                events: {
                  click: _ => { if (focus.value !== false) remove(focus.value.o) },
                }
              }),
              ui5.button({
                fields: {
                  icon: 'slim-arrow-left',
                  design: 'Transparent',
                  disabled: focusIsTopLevel,
                  tooltip: 'Move Level Up (Shift-ArrowLeft)',
                },
                events: {
                  click: _ => { if (focus.value !== false) move(focus.value.o, 'left') },
                }
              }),
              ui5.button({
                fields: {
                  icon: 'slim-arrow-up',
                  design: 'Transparent',
                  tooltip: 'Move Up (Shift-ArrowUp)',
                  disabled: focus.derive(f => f === false)
                },
                events: {
                  click: _ => { if (focus.value !== false) move(focus.value.o, 'up') },
                }
              }),
              ui5.button({
                fields: {
                  icon: 'slim-arrow-down',
                  design: 'Transparent',
                  tooltip: 'Move Down (Shift-ArrowDown)',
                  disabled: focus.derive(f => f === false)
                },
                events: {
                  click: _ => { if (focus.value !== false) move(focus.value.o, 'down') },
                }
              }),
              ui5.button({
                fields: {
                  icon: 'slim-arrow-right',
                  design: 'Transparent',
                  disabled: focusIsFirst,
                  tooltip: 'Move Level Down (Shift-ArrowRight)',
                },
                events: {
                  click: _ => { if (focus.value !== false) move(focus.value.o, 'right') },
                }
              }),
            ]
          ),

          ui5.tree(
            {
              ref: treeRef,
              events: {
                'item-toggle': e => {
                  const o = (e.detail.item as any)[outlineField] as OutlineNode;
                  o.expanded = !o.expanded;
                },
              }
            },
            outline.map(o => o.map(mkOutlineTemplate))
          ),
        ]
      ),
    ]
  }

  static styles = style.sheet({
    ':host': {
      overflow: 'auto',
    },
    '.outline-text': {
      display: 'grid',
      gridTemplateColumns: 'auto 20px',
    },
    '.outline-title': {
      fontSize: '90%',
      display: 'inline-block',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
    },
    '.outline-page-nr': {
      float: 'right',
      paddingRight: '.1em',
      paddingLeft: '0.5em',
      fontSize: '90%',
      fontStyle: 'italic',
      color: ui5.Theme.Content_DisabledTextColor,
      justifySelf: 'end',
    },
    '.outline-title, .outline-page-nr': {
      cursor: 'default',
    },
  })
}
