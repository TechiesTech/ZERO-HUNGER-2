const CLOUDINARY_UPLOAD_PATH = '/image/upload/';
const CLOUDINARY_TRANSFORM_PREFIXES = new Set([
  'a_',
  'ar_',
  'b_',
  'bo_',
  'c_',
  'd_',
  'dpr_',
  'e_',
  'eo_',
  'f_',
  'fl_',
  'fps_',
  'g_',
  'h_',
  'if_',
  'l_',
  'o_',
  'q_',
  'r_',
  'so_',
  't_',
  'u_',
  'vc_',
  'w_',
  'x_',
  'y_',
  'z_',
]);

function isTransformationSegment(segment: string): boolean {
  const transformations = segment.split(',');
  return transformations.every((part) => {
    const prefix = part.match(/^[a-z]+_/)?.[0];
    return prefix !== undefined && CLOUDINARY_TRANSFORM_PREFIXES.has(prefix);
  });
}

export function optimizeImageUrl(src: string): string {
  const uploadIndex = src.indexOf(CLOUDINARY_UPLOAD_PATH);
  if (uploadIndex === -1) return src;

  const prefixEnd = uploadIndex + CLOUDINARY_UPLOAD_PATH.length;
  const [imagePath, suffix = ''] = src.slice(prefixEnd).split(/(?=[?#])/s, 2);
  const pathSegments = imagePath.split('/');
  let transformationIndex = 0;

  while (
    transformationIndex < pathSegments.length &&
    isTransformationSegment(pathSegments[transformationIndex])
  ) {
    transformationIndex += 1;
  }

  const transformationParts =
    transformationIndex > 0
      ? pathSegments
          .slice(0, transformationIndex)
          .flatMap((segment) => segment.split(','))
      : [];
  const automaticTransformations = ['f_auto', 'q_auto'].filter(
    (transformation) => !transformationParts.includes(transformation)
  );

  if (automaticTransformations.length === 0) return src;

  if (transformationIndex > 0) {
    pathSegments[0] = `${pathSegments[0]},${automaticTransformations.join(',')}`;
  } else {
    pathSegments.unshift(automaticTransformations.join(','));
  }

  return `${src.slice(0, prefixEnd)}${pathSegments.join('/')}${suffix}`;
}
