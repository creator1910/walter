import ExpoModulesCore
import UIKit
import SwiftUI

class LiquidGlassView: ExpoView {

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    backgroundColor = .clear
    setupGlass()
  }

  private func setupGlass() {
    if #available(iOS 26.0, *) {
      setupSwiftUIGlass()
    } else {
      setupFallbackBlur()
    }
  }

  @available(iOS 26.0, *)
  private func setupSwiftUIGlass() {
    let host = LiquidGlassHostView()
    host.translatesAutoresizingMaskIntoConstraints = false
    host.backgroundColor = .clear
    addSubview(host)
    NSLayoutConstraint.activate([
      host.leadingAnchor.constraint(equalTo: leadingAnchor),
      host.trailingAnchor.constraint(equalTo: trailingAnchor),
      host.topAnchor.constraint(equalTo: topAnchor),
      host.bottomAnchor.constraint(equalTo: bottomAnchor),
    ])
  }

  private func setupFallbackBlur() {
    let blur = UIVisualEffectView(effect: UIBlurEffect(style: .systemChromeMaterial))
    blur.translatesAutoresizingMaskIntoConstraints = false
    addSubview(blur)
    NSLayoutConstraint.activate([
      blur.leadingAnchor.constraint(equalTo: leadingAnchor),
      blur.trailingAnchor.constraint(equalTo: trailingAnchor),
      blur.topAnchor.constraint(equalTo: topAnchor),
      blur.bottomAnchor.constraint(equalTo: bottomAnchor),
    ])
  }
}

// MARK: - iOS 26 SwiftUI glass host

@available(iOS 26.0, *)
class LiquidGlassHostView: UIView {

  private weak var hostController: UIViewController?

  override func didMoveToWindow() {
    super.didMoveToWindow()
    guard window != nil, hostController == nil else { return }
    embed()
  }

  private func embed() {
    // Build the SwiftUI glass surface
    let content = GlassSurface()
    let controller = UIHostingController(rootView: content)
    controller.view.backgroundColor = .clear
    controller.view.translatesAutoresizingMaskIntoConstraints = false

    // Find the nearest UIViewController to adopt the host controller
    var parentVC: UIViewController?
    var responder: UIResponder? = self.next
    while let r = responder {
      if let vc = r as? UIViewController {
        parentVC = vc
        break
      }
      responder = r.next
    }

    if let parent = parentVC {
      parent.addChild(controller)
      addSubview(controller.view)
      NSLayoutConstraint.activate([
        controller.view.leadingAnchor.constraint(equalTo: leadingAnchor),
        controller.view.trailingAnchor.constraint(equalTo: trailingAnchor),
        controller.view.topAnchor.constraint(equalTo: topAnchor),
        controller.view.bottomAnchor.constraint(equalTo: bottomAnchor),
      ])
      controller.didMove(toParent: parent)
    } else {
      addSubview(controller.view)
      NSLayoutConstraint.activate([
        controller.view.leadingAnchor.constraint(equalTo: leadingAnchor),
        controller.view.trailingAnchor.constraint(equalTo: trailingAnchor),
        controller.view.topAnchor.constraint(equalTo: topAnchor),
        controller.view.bottomAnchor.constraint(equalTo: bottomAnchor),
      ])
    }
    hostController = controller
  }
}

// MARK: - SwiftUI view

@available(iOS 26.0, *)
private struct GlassSurface: View {
  var body: some View {
    Color.clear
      .glassEffect()
  }
}
