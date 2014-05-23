import json
import os

from waflib.Configure import conf

top = '.'
out = 'build'

def options(ctx):
    ctx.load('pebble_sdk')

def configure(ctx):
    ctx.load('pebble_sdk')

def build(ctx):
    ctx.load('pebble_sdk')

    ctx.pbl_program(source=ctx.path.ant_glob('src/**/*.c'),
                    cflags=['-Wno-address',
                            '-Wno-type-limits',
                            '-Wno-missing-field-initializers'],
                    target='pebble-app.elf')

    js_target = ctx.concat_javascript(js_path='lib')

    ctx.pbl_bundle(elf='pebble-app.elf',
                   js=js_target)

@conf
def concat_javascript(self, *k, **kw):
    js_path = kw['js_path']
    js_nodes = self.path.ant_glob(js_path + '/**/*.js')

    if not js_nodes:
        return []

    def concat_javascript_task(task):
        LOADER_TEMPLATE = "__loader.define({relpath}, function(module, require) {{\n{body}\n}});"

        sources = []
        for node in task.inputs:
            relpath = os.path.relpath(node.abspath(), js_path)
            with open(node.abspath(), 'r') as f:
                if relpath == 'loader.js':
                    sources.insert(0, f.read())
                elif relpath.startswith('vendor/'):
                    sources.append(f.read())
                else:
                    sources.append(LOADER_TEMPLATE.format(relpath=json.dumps(relpath), body=f.read()))

        sources.append('__loader.require("main");')

        with open(task.outputs[0].abspath(), 'w') as f:
            f.write('\n'.join(sources))

    js_target = self.path.make_node('src/js/pebble-js-app.js')

    self(rule=concat_javascript_task,
        source=js_nodes,
        target=js_target)

    return js_target

# vim:filetype=python
