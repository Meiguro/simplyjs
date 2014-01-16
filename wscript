top = '.'
out = 'build'

def options(ctx):
    ctx.load('pebble_sdk')

def configure(ctx):
    ctx.load('pebble_sdk')

def build(ctx):
    ctx.load('pebble_sdk')

    ctx.pbl_program(source=ctx.path.ant_glob('src/**/*.c'),
                    cflags=['-Wno-type-limits',
                            '-Wno-address'],
                    target='pebble-app.elf')

    def package_javascript(task):
        cmd = ['cat']
        cmd.extend([x.abspath() for x in task.inputs])
        cmd.extend(['>', task.outputs[0].abspath()])
        task.exec_command(' '.join(cmd))

    js_files = ctx.path.ant_glob('src/js/**/*.js')
    js_target = ctx.path.make_node('build/src/js/pebble-js-app.js')

    if js_files:
        ctx(rule=package_javascript,
            source=js_files,
            target=js_target)

    ctx.pbl_bundle(elf='pebble-app.elf',
                   js=js_target)

# vim:filetype=python
