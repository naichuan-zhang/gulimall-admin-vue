export default function (file) {
  return require('@/views/' + file + '.vue').default
}
